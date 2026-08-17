-- Estadísticas administrativas agregadas, sin datos personales ni registros demo.

begin;

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
    where not is_demo and published_at <= now()
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
  'Entrega indicadores operacionales agregados a administradores; excluye datos personales y registros demo.';

revoke all on function public.get_admin_statistics(integer) from public, anon;
grant execute on function public.get_admin_statistics(integer) to authenticated;

commit;
