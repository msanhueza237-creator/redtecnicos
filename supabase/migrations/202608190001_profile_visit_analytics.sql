-- Analítica agregada de fichas públicas.
-- No se conservan IP, cookies, correos ni identificadores de visitantes.

begin;

create table if not exists public.profile_daily_views (
  profile_id uuid not null references public.professional_profiles(id) on delete cascade,
  viewed_on date not null,
  view_count bigint not null default 0 check (view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, viewed_on)
);

comment on table public.profile_daily_views is
  'Conteos diarios agregados de aperturas de perfiles públicos. No contiene datos personales del visitante.';

create index if not exists profile_daily_views_period_rank_idx
  on public.profile_daily_views (viewed_on desc, view_count desc);

alter table public.profile_daily_views enable row level security;
revoke all on public.profile_daily_views from public, anon, authenticated;
grant select, insert, update, delete on public.profile_daily_views to service_role;

create or replace function public.record_public_profile_view(
  p_profile_slug text,
  p_view_key_hash text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_profile_id uuid;
  local_view_date date := timezone('America/Santiago', now())::date;
  rate_action text;
begin
  if char_length(trim(coalesce(p_profile_slug, ''))) not between 3 and 180
    or trim(p_profile_slug) !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'INVALID_PROFILE_SLUG';
  end if;

  select directory.profile_id
  into target_profile_id
  from public.directory_profiles directory
  where directory.slug = trim(p_profile_slug)
    and directory.is_published
    and not directory.is_demo
    and directory.published_at <= now();

  if target_profile_id is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  rate_action := 'profile_view_' || md5(trim(p_profile_slug));
  perform private.consume_rate_limit(p_view_key_hash, rate_action, 60, 60);

  insert into public.profile_daily_views (profile_id, viewed_on, view_count)
  values (target_profile_id, local_view_date, 1)
  on conflict (profile_id, viewed_on)
  do update set
    view_count = public.profile_daily_views.view_count + 1,
    updated_at = now();

  -- Retención operacional: 13 meses de agregados, sin registros individuales.
  delete from public.profile_daily_views
  where viewed_on < local_view_date - interval '13 months';
end;
$$;

comment on function public.record_public_profile_view(text, text) is
  'Incrementa un conteo agregado para una ficha pública mediante una llave de red rotativa y limitada.';

revoke all on function public.record_public_profile_view(text, text) from public, anon, authenticated;
grant execute on function public.record_public_profile_view(text, text) to service_role;

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
    select profile_id, slug, display_name, kind, region_code
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
  period_profile_views as (
    select views.profile_id, sum(views.view_count)::bigint as value
    from public.profile_daily_views views
    join published_profiles directory on directory.profile_id = views.profile_id
    where views.viewed_on >= period_start_date
    group by views.profile_id
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
      'profileViews', coalesce((select sum(value) from period_profile_views), 0),
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
    'topProfiles', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'profileId', ranked.profile_id,
          'slug', ranked.slug,
          'name', ranked.display_name,
          'kind', ranked.kind,
          'value', ranked.value
        ) order by ranked.value desc, ranked.display_name
      )
      from (
        select directory.profile_id, directory.slug, directory.display_name, directory.kind, views.value
        from period_profile_views views
        join published_profiles directory on directory.profile_id = views.profile_id
        order by views.value desc, directory.display_name
        limit 10
      ) ranked
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
  'Entrega indicadores agregados, incluidas visitas a fichas, únicamente a administradores.';

revoke all on function public.get_admin_statistics(integer) from public, anon;
grant execute on function public.get_admin_statistics(integer) to authenticated;

commit;
