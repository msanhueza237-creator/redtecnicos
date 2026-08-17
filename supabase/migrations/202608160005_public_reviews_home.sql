begin;

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
    and not directory.is_demo
    and directory.published_at <= now()
  order by coalesce(review.moderated_at, review.created_at) desc
  limit least(greatest(coalesce(p_limit, 3), 1), 6);
$$;

revoke all on function public.list_public_reviews(integer) from public;
grant execute on function public.list_public_reviews(integer) to anon, authenticated;

commit;
