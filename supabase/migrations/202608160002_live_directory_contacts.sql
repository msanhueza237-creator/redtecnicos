-- Directorio y solicitudes públicas reales.
-- Los contactos privados solo se revelan desde una función que primero registra la solicitud.

begin;

alter table public.contact_requests
  add column if not exists email_verification_token_hash text unique;

alter table public.reviews
  add column if not exists would_recommend boolean not null default false;

create index if not exists contact_requests_email_profile_recent_idx
  on public.contact_requests (lower(requester_email), professional_profile_id, created_at desc);

revoke insert on public.contact_requests from anon, authenticated;

create or replace function private.consume_rate_limit(
  rate_key text,
  rate_action text,
  maximum_attempts integer,
  window_minutes integer
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  current_window timestamptz;
  updated_attempts integer;
begin
  if rate_key !~ '^[a-f0-9]{64}$' or char_length(rate_action) not between 3 and 80 then
    raise exception 'INVALID_RATE_LIMIT_KEY';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from now()) / (window_minutes * 60)) * (window_minutes * 60)
  );

  insert into public.rate_limits (
    key_hash, action, window_started_at, attempts, expires_at
  ) values (
    rate_key, rate_action, current_window, 1,
    current_window + make_interval(mins => window_minutes)
  )
  on conflict (key_hash, action, window_started_at)
  do update set attempts = public.rate_limits.attempts + 1
  where public.rate_limits.attempts < maximum_attempts
  returning attempts into updated_attempts;

  if updated_attempts is null then
    raise exception 'RATE_LIMIT_EXCEEDED';
  end if;
end;
$$;

revoke all on function private.consume_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;

create or replace function public.create_public_contact_request(
  p_professional_profile_id uuid,
  p_professional_slug text,
  p_requester_name text,
  p_requester_email text,
  p_requester_phone text,
  p_requester_commune text,
  p_requested_service text,
  p_description text,
  p_tracking_token_hash text,
  p_email_verification_token_hash text,
  p_request_key_hash text,
  p_consent_version text
)
returns table (
  request_id uuid,
  request_status public.contact_request_state,
  request_created_at timestamptz,
  professional_slug text,
  professional_display_name text,
  professional_email text,
  professional_phone text,
  professional_whatsapp text
)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  target_directory public.directory_profiles%rowtype;
  target_contact public.professional_contacts%rowtype;
  created_request public.contact_requests%rowtype;
  normalized_email text := lower(trim(p_requester_email));
  email_rate_key text;
begin
  if char_length(trim(p_requester_name)) not between 2 and 80
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(normalized_email) > 254
    or char_length(trim(p_requester_phone)) not between 8 and 24
    or char_length(trim(p_requester_commune)) not between 2 and 80
    or char_length(trim(p_requested_service)) not between 2 and 120
    or char_length(trim(p_description)) not between 10 and 1200
    or p_tracking_token_hash !~ '^[a-f0-9]{64}$'
    or p_email_verification_token_hash !~ '^[a-f0-9]{64}$'
    or char_length(trim(p_consent_version)) not between 3 and 40 then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into target_directory
  from public.directory_profiles
  where profile_id = p_professional_profile_id
    and slug = trim(p_professional_slug)
    and not is_demo
    and published_at <= now();

  if not found then raise exception 'PROFESSIONAL_NOT_FOUND'; end if;

  if not (trim(p_requester_commune) = any(target_directory.commune_codes))
    or not (trim(p_requested_service) = any(target_directory.services)) then
    raise exception 'INVALID_PROFILE_SELECTION';
  end if;

  select * into target_contact
  from public.professional_contacts
  where profile_id = target_directory.profile_id;

  if not found then raise exception 'PROFESSIONAL_CONTACT_UNAVAILABLE'; end if;

  email_rate_key := encode(
    extensions.digest(convert_to(normalized_email || ':' || p_professional_profile_id::text, 'UTF8'), 'sha256'),
    'hex'
  );
  perform private.consume_rate_limit(email_rate_key, 'contact_request_email', 3, 60);
  perform private.consume_rate_limit(p_request_key_hash, 'contact_request_network', 8, 60);

  insert into public.contact_requests (
    professional_profile_id,
    requester_name,
    requester_email,
    requester_phone,
    requester_commune,
    requested_service,
    description,
    tracking_token_hash,
    email_verification_token_hash
  ) values (
    target_directory.profile_id,
    trim(p_requester_name),
    normalized_email,
    trim(p_requester_phone),
    trim(p_requester_commune),
    trim(p_requested_service),
    trim(p_description),
    p_tracking_token_hash,
    p_email_verification_token_hash
  ) returning * into created_request;

  insert into public.consents (
    contact_request_id,
    subject_email_hash,
    consent_type,
    document_version
  ) values (
    created_request.id,
    encode(extensions.digest(convert_to(normalized_email, 'UTF8'), 'sha256'), 'hex'),
    'contact_request_data_processing',
    trim(p_consent_version)
  );

  return query select
    created_request.id,
    created_request.status,
    created_request.created_at,
    target_directory.slug,
    target_directory.display_name,
    target_contact.public_email,
    target_contact.public_phone,
    coalesce(target_contact.whatsapp_phone, target_contact.public_phone);
end;
$$;

revoke all on function public.create_public_contact_request(
  uuid, text, text, text, text, text, text, text, text, text, text, text
) from public;
grant execute on function public.create_public_contact_request(
  uuid, text, text, text, text, text, text, text, text, text, text, text
) to anon, authenticated;

create or replace function public.get_public_contact_request_by_token(
  p_tracking_token_hash text
)
returns table (
  request_id uuid,
  request_status public.contact_request_state,
  request_created_at timestamptz,
  requested_service text,
  requester_commune text,
  request_description text,
  requester_name text,
  requester_email_verified_at timestamptz,
  professional_slug text,
  professional_display_name text,
  review_data jsonb
)
language sql
security definer
stable
set search_path = public
as $$
  select
    request.id,
    request.status,
    request.created_at,
    request.requested_service,
    request.requester_commune,
    request.description,
    request.requester_name,
    request.requester_email_verified_at,
    directory.slug,
    directory.display_name,
    case when review.id is null then null else jsonb_build_object(
      'id', review.id,
      'status', review.status,
      'rating', review.rating,
      'comment', review.comment,
      'wouldRecommend', review.would_recommend,
      'submittedAt', review.created_at
    ) end
  from public.contact_requests request
  join public.directory_profiles directory
    on directory.profile_id = request.professional_profile_id
  left join public.reviews review on review.contact_request_id = request.id
  where request.tracking_token_hash = p_tracking_token_hash
    and not request.is_demo
  limit 1;
$$;

revoke all on function public.get_public_contact_request_by_token(text) from public;
grant execute on function public.get_public_contact_request_by_token(text) to anon, authenticated;

create or replace function public.verify_contact_request_email(
  p_verification_token_hash text,
  p_tracking_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  update public.contact_requests
  set requester_email_verified_at = coalesce(requester_email_verified_at, now()),
      updated_at = now()
  where email_verification_token_hash = p_verification_token_hash
    and tracking_token_hash = p_tracking_token_hash
    and not is_demo
  returning id into target_id;

  if target_id is null then raise exception 'VERIFICATION_NOT_FOUND'; end if;
  return target_id;
end;
$$;

revoke all on function public.verify_contact_request_email(text, text) from public;
grant execute on function public.verify_contact_request_email(text, text) to anon, authenticated;

create or replace function public.complete_public_contact_request(
  p_tracking_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  update public.contact_requests
  set status = 'completed', completed_at = now(), updated_at = now()
  where tracking_token_hash = p_tracking_token_hash
    and status in ('new', 'viewed', 'contacted', 'accepted')
    and not is_demo
  returning id into target_id;

  if target_id is null then raise exception 'REQUEST_NOT_ELIGIBLE'; end if;
  return target_id;
end;
$$;

revoke all on function public.complete_public_contact_request(text) from public;
grant execute on function public.complete_public_contact_request(text) to anon, authenticated;

create or replace function public.create_public_review(
  p_tracking_token_hash text,
  p_rating integer,
  p_comment text,
  p_would_recommend boolean
)
returns table (
  review_id uuid,
  request_id uuid,
  review_status public.review_state,
  review_rating smallint,
  review_comment text,
  review_would_recommend boolean,
  review_created_at timestamptz,
  professional_slug text,
  professional_display_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_request public.contact_requests%rowtype;
  created_review public.reviews%rowtype;
begin
  if p_rating not between 1 and 5 or char_length(trim(p_comment)) not between 10 and 600 then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into target_request
  from public.contact_requests
  where tracking_token_hash = p_tracking_token_hash and not is_demo;

  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  if target_request.status <> 'completed' or target_request.requester_email_verified_at is null then
    raise exception 'REQUEST_NOT_ELIGIBLE';
  end if;
  if exists (select 1 from public.reviews where contact_request_id = target_request.id) then
    raise exception 'REVIEW_ALREADY_SUBMITTED';
  end if;

  insert into public.reviews (
    contact_request_id,
    professional_profile_id,
    rating,
    comment,
    would_recommend,
    status
  ) values (
    target_request.id,
    target_request.professional_profile_id,
    p_rating,
    trim(p_comment),
    p_would_recommend,
    'pending'
  ) returning * into created_review;

  return query
  select
    created_review.id,
    created_review.contact_request_id,
    created_review.status,
    created_review.rating,
    created_review.comment,
    created_review.would_recommend,
    created_review.created_at,
    directory.slug,
    directory.display_name
  from public.directory_profiles directory
  where directory.profile_id = created_review.professional_profile_id;
end;
$$;

revoke all on function public.create_public_review(text, integer, text, boolean) from public;
grant execute on function public.create_public_review(text, integer, text, boolean) to anon, authenticated;

revoke update (status, completed_at) on public.contact_requests from authenticated;

create or replace function public.update_owned_contact_request_status(
  p_request_id uuid,
  p_next_status public.contact_request_state
)
returns public.contact_request_state
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.contact_request_state;
begin
  select request.status into current_status
  from public.contact_requests request
  join public.directory_profiles directory
    on directory.profile_id = request.professional_profile_id
  where request.id = p_request_id
    and directory.owner_user_id = (select auth.uid())
  for update of request;

  if current_status is null then raise exception 'REQUEST_NOT_FOUND'; end if;
  if current_status = p_next_status then return current_status; end if;

  if not (
    (current_status = 'new' and p_next_status in ('viewed', 'contacted', 'accepted', 'rejected'))
    or (current_status = 'viewed' and p_next_status in ('contacted', 'accepted', 'rejected'))
    or (current_status = 'contacted' and p_next_status in ('accepted', 'rejected', 'completed'))
    or (current_status = 'accepted' and p_next_status in ('completed', 'rejected'))
  ) then
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;

  update public.contact_requests
  set status = p_next_status,
      completed_at = case when p_next_status = 'completed' then now() else completed_at end,
      updated_at = now()
  where id = p_request_id;

  return p_next_status;
end;
$$;

revoke all on function public.update_owned_contact_request_status(uuid, public.contact_request_state) from public, anon;
grant execute on function public.update_owned_contact_request_status(uuid, public.contact_request_state) to authenticated;

create or replace function private.refresh_directory_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile_id uuid := coalesce(new.professional_profile_id, old.professional_profile_id);
begin
  update public.directory_profiles directory
  set rating = aggregate.average_rating,
      review_count = aggregate.review_total,
      updated_at = now()
  from (
    select
      coalesce(round(avg(rating)::numeric, 1), 0) as average_rating,
      count(*)::integer as review_total
    from public.reviews
    where professional_profile_id = target_profile_id and status = 'published'
  ) aggregate
  where directory.profile_id = target_profile_id;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists reviews_refresh_directory_rating on public.reviews;
create trigger reviews_refresh_directory_rating
after insert or update of status, rating or delete on public.reviews
for each row execute function private.refresh_directory_rating();

commit;
