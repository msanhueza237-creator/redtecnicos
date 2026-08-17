-- Retira del directorio los perfiles rechazados o suspendidos sin destruir
-- la proyección histórica que utilizan solicitudes y evaluaciones.

begin;

alter table public.directory_profiles
  add column if not exists is_published boolean not null default true;

comment on column public.directory_profiles.is_published is
  'Controla la exposición pública. La fila se conserva al ocultarse para no romper solicitudes ni evaluaciones históricas.';

update public.directory_profiles directory
set is_published = false,
    updated_at = now()
from public.professional_profiles profile
where profile.id = directory.profile_id
  and profile.status in ('rejected', 'suspended', 'deleted', 'expired_documents')
  and directory.is_published;

create index if not exists directory_profiles_public_rank_idx
  on public.directory_profiles (score desc, published_at desc)
  where is_published and not is_demo;

create or replace function private.sync_directory_profile_visibility()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('rejected', 'suspended', 'deleted', 'expired_documents') then
    update public.directory_profiles
    set is_published = false,
        updated_at = now()
    where profile_id = new.id
      and is_published;
  elsif new.status in ('approved', 'verified')
    and old.status in ('rejected', 'suspended', 'deleted', 'expired_documents') then
    update public.directory_profiles
    set is_published = true,
        published_at = now(),
        updated_at = now()
    where profile_id = new.id
      and not is_published;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_directory_profile_visibility() from public, anon, authenticated;

drop trigger if exists professional_profile_visibility_sync on public.professional_profiles;
create trigger professional_profile_visibility_sync
after update of status on public.professional_profiles
for each row
when (old.status is distinct from new.status)
execute function private.sync_directory_profile_visibility();

drop policy if exists directory_public_read on public.directory_profiles;
create policy directory_public_read on public.directory_profiles
for select to anon, authenticated
using (is_published and not is_demo and published_at <= now());

-- Una función SECURITY DEFINER crea las solicitudes. Este control evita que una
-- URL o identificador antiguo permita contactar un perfil ya retirado.
create or replace function private.enforce_contact_request_public_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.is_demo and not exists (
    select 1
    from public.directory_profiles directory
    where directory.profile_id = new.professional_profile_id
      and directory.is_published
      and not directory.is_demo
      and directory.published_at <= now()
  ) then
    raise exception 'PROFESSIONAL_NOT_FOUND';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_contact_request_public_profile() from public, anon, authenticated;

drop trigger if exists contact_request_public_profile_guard on public.contact_requests;
create trigger contact_request_public_profile_guard
before insert on public.contact_requests
for each row
execute function private.enforce_contact_request_public_profile();

-- Los objetos aprobados permanecen privados si el perfil deja de estar
-- publicado, aunque alguien conserve una ruta antigua del bucket.
drop policy if exists storage_approved_gallery_read on storage.objects;
create policy storage_approved_gallery_read on storage.objects
for select to anon, authenticated
using (
  bucket_id in ('profile-images', 'gallery-images')
  and (
    exists (
      select 1
      from public.portfolio_items item
      join public.directory_profiles directory on directory.profile_id = item.profile_id
      where item.storage_path = name
        and item.status = 'reviewed'
        and directory.is_published
        and not directory.is_demo
    )
    or exists (
      select 1
      from public.directory_profiles profile
      where profile.avatar_path = name
        and profile.is_published
        and not profile.is_demo
    )
  )
);

create or replace function public.list_public_reviews(p_limit integer default 3)
returns table (
  review_id uuid,
  profile_slug text,
  professional_name text,
  professional_kind public.professional_kind,
  review_rating smallint,
  review_comment text,
  would_recommend boolean,
  requester_commune text,
  requested_service text,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    review.id,
    directory.slug,
    directory.display_name,
    directory.kind,
    review.rating,
    review.comment,
    review.would_recommend,
    request.requester_commune,
    request.requested_service,
    coalesce(review.moderated_at, review.created_at)
  from public.reviews review
  join public.contact_requests request
    on request.id = review.contact_request_id
  join public.directory_profiles directory
    on directory.profile_id = review.professional_profile_id
  where review.status = 'published'
    and request.status = 'completed'
    and request.requester_email_verified_at is not null
    and not request.is_demo
    and directory.is_published
    and not directory.is_demo
    and directory.published_at <= now()
  order by coalesce(review.moderated_at, review.created_at) desc
  limit least(greatest(coalesce(p_limit, 3), 1), 6);
$$;

revoke all on function public.list_public_reviews(integer) from public;
grant execute on function public.list_public_reviews(integer) to anon, authenticated;

create or replace function public.get_admin_statistics(
  p_period_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  period_start_date date;
  period_start_at timestamptz;
  result jsonb;
begin
  if not (select private.is_admin()) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  if p_period_days not in (7, 30, 90, 365) then
    raise exception 'El período debe ser 7, 30, 90 o 365 días.';
  end if;

  period_start_date := timezone('America/Santiago', now())::date - (p_period_days - 1);
  period_start_at := period_start_date::timestamp at time zone 'America/Santiago';

  with
  published_profiles as (
    select profile_id, region_code
    from public.directory_profiles
    where is_published and not is_demo and published_at <= now()
  ),
  period_requests as (
    select
      request.id,
      request.status,
      request.requested_service,
      directory.region_code,
      timezone('America/Santiago', request.created_at)::date as local_created_date
    from public.contact_requests request
    join published_profiles directory
      on directory.profile_id = request.professional_profile_id
    where not request.is_demo
      and request.created_at >= period_start_at
  ),
  request_by_day as (
    select local_created_date as day, count(*)::integer as value
    from period_requests
    group by local_created_date
  ),
  calendar as (
    select generate_series(
      period_start_date::timestamp,
      timezone('America/Santiago', now())::date::timestamp,
      interval '1 day'
    )::date as day
  ),
  published_reviews as (
    select review.rating
    from public.reviews review
    join public.contact_requests request
      on request.id = review.contact_request_id and not request.is_demo
    join published_profiles directory
      on directory.profile_id = review.professional_profile_id
    where review.status = 'published'
  ),
  pending_reviews as (
    select review.id
    from public.reviews review
    join public.contact_requests request
      on request.id = review.contact_request_id and not request.is_demo
    join published_profiles directory
      on directory.profile_id = review.professional_profile_id
    where review.status = 'pending'
  ),
  open_complaints as (
    select complaint.id
    from public.complaints complaint
    where not complaint.is_demo
      and complaint.status not in ('resolved', 'dismissed')
  )
  select jsonb_build_object(
    'periodDays', p_period_days,
    'generatedAt', now(),
    'metrics', jsonb_build_object(
      'requestsCreated', (select count(*) from period_requests),
      'completedRequests', (select count(*) from period_requests where status = 'completed'),
      'completionRate', coalesce(
        (select round(
          100.0 * count(*) filter (where status = 'completed') / nullif(count(*), 0),
          1
        ) from period_requests),
        0
      ),
      'publishedProfiles', (select count(*) from published_profiles),
      'averageRating', coalesce((select round(avg(rating)::numeric, 1) from published_reviews), 0),
      'publishedReviews', (select count(*) from published_reviews),
      'pendingReviews', (select count(*) from pending_reviews),
      'openComplaints', (select count(*) from open_complaints)
    ),
    'requestTimeline', coalesce((
      select jsonb_agg(
        jsonb_build_object('date', calendar.day, 'value', coalesce(request_by_day.value, 0))
        order by calendar.day
      )
      from calendar
      left join request_by_day on request_by_day.day = calendar.day
    ), '[]'::jsonb),
    'regions', coalesce((
      select jsonb_agg(jsonb_build_object('key', region_code, 'value', value) order by value desc, region_code)
      from (
        select region_code, count(*)::integer as value
        from period_requests
        group by region_code
        order by value desc, region_code
        limit 6
      ) region_totals
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object('key', requested_service, 'value', value) order by value desc, requested_service)
      from (
        select requested_service, count(*)::integer as value
        from period_requests
        group by requested_service
        order by value desc, requested_service
        limit 6
      ) service_totals
    ), '[]'::jsonb),
    'requestStatuses', coalesce((
      select jsonb_agg(jsonb_build_object('key', status::text, 'value', value) order by status::text)
      from (
        select status, count(*)::integer as value
        from period_requests
        group by status
      ) status_totals
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

comment on function public.get_admin_statistics(integer) is
  'Entrega indicadores agregados a administradores y cuenta únicamente perfiles actualmente publicados.';

revoke all on function public.get_admin_statistics(integer) from public, anon;
grant execute on function public.get_admin_statistics(integer) to authenticated;

commit;
