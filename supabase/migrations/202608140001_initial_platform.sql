-- Red Técnicos Chile — esquema inicial dedicado.
-- Aplicar únicamente en una instancia Supabase independiente para este proyecto.

begin;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.app_role as enum (
  'technician',
  'company',
  'moderator',
  'admin',
  'superadmin'
);

create type public.account_status as enum ('active', 'suspended', 'deleted');
create type public.professional_kind as enum ('technician', 'company');
create type public.professional_category as enum ('industrial', 'commercial', 'residential');
create type public.profile_status as enum (
  'draft',
  'submitted',
  'under_review',
  'changes_requested',
  'approved',
  'verified',
  'suspended',
  'rejected',
  'deleted',
  'expired_documents'
);
create type public.review_state as enum ('pending', 'published', 'rejected', 'hidden');
create type public.moderation_state as enum (
  'declared',
  'pending_review',
  'reviewed',
  'changes_requested',
  'rejected',
  'hidden'
);
create type public.contact_request_state as enum (
  'new',
  'viewed',
  'contacted',
  'accepted',
  'rejected',
  'completed',
  'cancelled',
  'expired'
);

create table public.app_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'technician',
  display_name text not null check (char_length(display_name) between 2 and 100),
  phone text,
  account_status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references public.app_users(user_id) on delete cascade,
  kind public.professional_kind not null,
  slug text unique,
  display_name text not null check (char_length(display_name) between 2 and 100),
  headline text not null default '' check (char_length(headline) <= 160),
  summary text not null default '' check (char_length(summary) <= 1600),
  categories public.professional_category[] not null default '{}',
  region_code text,
  commune_codes text[] not null default '{}',
  services text[] not null default '{}',
  specialties text[] not null default '{}',
  years_experience integer not null default 0 check (years_experience between 0 and 70),
  modalities text[] not null default '{}',
  has_vehicle boolean not null default false,
  availability text,
  status public.profile_status not null default 'draft',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.app_users(user_id),
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_contacts (
  profile_id uuid primary key references public.professional_profiles(id) on delete cascade,
  public_email text not null,
  public_phone text not null,
  whatsapp_phone text,
  updated_at timestamptz not null default now()
);

create table public.qualifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.professional_profiles(id) on delete cascade,
  qualification_type text not null check (qualification_type in ('professional_degree', 'technical_degree', 'training')),
  title text not null check (char_length(title) between 2 and 180),
  institution text not null check (char_length(institution) between 2 and 180),
  issued_year integer not null check (issued_year between 1950 and 2100),
  expires_at date,
  document_path text,
  status public.moderation_state not null default 'declared',
  review_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.app_users(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.professional_profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  category public.professional_category not null,
  description text not null default '' check (char_length(description) <= 600),
  storage_path text not null unique,
  alt_text text not null check (char_length(alt_text) between 5 and 220),
  display_order smallint not null check (display_order between 1 and 3),
  status public.moderation_state not null default 'pending_review',
  review_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.app_users(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, display_order)
);

-- Proyección explícita: solo datos revisados y seguros para publicar.
create table public.directory_profiles (
  profile_id uuid primary key references public.professional_profiles(id) on delete cascade,
  owner_user_id uuid not null references public.app_users(user_id) on delete cascade,
  slug text not null unique,
  kind public.professional_kind not null,
  display_name text not null,
  headline text not null,
  summary text not null,
  categories public.professional_category[] not null,
  region_code text not null,
  commune_codes text[] not null,
  services text[] not null,
  specialties text[] not null,
  years_experience integer not null,
  modalities text[] not null,
  has_vehicle boolean not null,
  availability text,
  score integer not null default 0 check (score between 0 and 100),
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  badges text[] not null default '{}',
  qualifications jsonb not null default '[]'::jsonb,
  portfolio jsonb not null default '[]'::jsonb,
  avatar_path text,
  is_verified boolean not null default false,
  is_demo boolean not null default false,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(qualifications) = 'array'),
  check (jsonb_typeof(portfolio) = 'array'),
  check (jsonb_array_length(portfolio) <= 3)
);

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references public.directory_profiles(profile_id),
  requester_name text not null check (char_length(requester_name) between 2 and 100),
  requester_email text not null,
  requester_phone text not null,
  requester_commune text not null,
  requested_service text not null,
  description text not null check (char_length(description) between 10 and 2000),
  status public.contact_request_state not null default 'new',
  tracking_token_hash text not null unique,
  requester_email_verified_at timestamptz,
  completed_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid not null unique references public.contact_requests(id) on delete restrict,
  professional_profile_id uuid not null references public.directory_profiles(profile_id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1500),
  status public.review_state not null default 'pending',
  moderated_at timestamptz,
  moderated_by uuid references public.app_users(user_id),
  moderation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid references public.app_users(user_id) on delete restrict,
  contact_request_id uuid references public.contact_requests(id) on delete restrict,
  subject_email_hash text,
  consent_type text not null,
  document_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (num_nonnulls(user_id, contact_request_id, subject_email_hash) >= 1)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.app_users(user_id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  reason text not null check (char_length(reason) between 3 and 1000),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table public.rate_limits (
  key_hash text not null,
  action text not null,
  window_started_at timestamptz not null,
  attempts integer not null default 1 check (attempts > 0),
  expires_at timestamptz not null,
  primary key (key_hash, action, window_started_at)
);

create index professional_profiles_status_idx on public.professional_profiles(status);
create index directory_profiles_region_idx on public.directory_profiles(region_code);
create index directory_profiles_categories_idx on public.directory_profiles using gin(categories);
create index directory_profiles_services_idx on public.directory_profiles using gin(services);
create index contact_requests_profile_created_idx on public.contact_requests(professional_profile_id, created_at desc);
create index qualifications_profile_status_idx on public.qualifications(profile_id, status);
create index portfolio_profile_status_idx on public.portfolio_items(profile_id, status);
create index reviews_profile_status_idx on public.reviews(professional_profile_id, status);
create index audit_log_created_idx on public.audit_log(created_at desc);
create index rate_limits_expiry_idx on public.rate_limits(expires_at);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_users_set_updated_at before update on public.app_users
for each row execute function private.set_updated_at();
create trigger profiles_set_updated_at before update on public.professional_profiles
for each row execute function private.set_updated_at();
create trigger contacts_set_updated_at before update on public.professional_contacts
for each row execute function private.set_updated_at();
create trigger qualifications_set_updated_at before update on public.qualifications
for each row execute function private.set_updated_at();
create trigger portfolio_set_updated_at before update on public.portfolio_items
for each row execute function private.set_updated_at();
create trigger directory_set_updated_at before update on public.directory_profiles
for each row execute function private.set_updated_at();
create trigger contact_requests_set_updated_at before update on public.contact_requests
for each row execute function private.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function private.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_kind text;
  safe_role public.app_role;
  safe_name text;
begin
  requested_kind := coalesce(new.raw_user_meta_data ->> 'entity_kind', 'technician');
  safe_role := case when requested_kind = 'company' then 'company'::public.app_role else 'technician'::public.app_role end;
  safe_name := left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))), 100);
  if char_length(safe_name) < 2 then safe_name := 'Profesional'; end if;

  insert into public.app_users (user_id, role, display_name)
  values (new.id, safe_role, safe_name);

  insert into public.professional_profiles (owner_user_id, kind, display_name)
  values (
    new.id,
    case when safe_role = 'company' then 'company'::public.professional_kind else 'technician'::public.professional_kind end,
    safe_name
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.app_users
  where user_id = (select auth.uid())
    and account_status = 'active'::public.account_status;
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select private.current_app_role()) in (
      'moderator'::public.app_role,
      'admin'::public.app_role,
      'superadmin'::public.app_role
    ),
    false
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select private.current_app_role()) in (
      'admin'::public.app_role,
      'superadmin'::public.app_role
    ),
    false
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.assign_role_by_email(
  target_email text,
  new_role public.app_role,
  change_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  previous_role public.app_role;
begin
  if char_length(trim(change_reason)) < 3 then
    raise exception 'Se requiere un motivo de auditoría.';
  end if;

  select u.id, a.role into target_id, previous_role
  from auth.users u
  join public.app_users a on a.user_id = u.id
  where lower(u.email) = lower(trim(target_email));

  if target_id is null then raise exception 'Usuario no encontrado.'; end if;

  update public.app_users set role = new_role where user_id = target_id;
  update public.professional_profiles
  set kind = case when new_role = 'company' then 'company'::public.professional_kind else kind end
  where owner_user_id = target_id;

  insert into public.audit_log (actor_user_id, action, entity_type, entity_id, reason, before_data, after_data)
  values (
    null,
    'role.assigned',
    'app_user',
    target_id::text,
    trim(change_reason),
    jsonb_build_object('role', previous_role),
    jsonb_build_object('role', new_role)
  );

  return target_id;
end;
$$;

revoke all on function private.assign_role_by_email(text, public.app_role, text) from public, anon, authenticated;

alter table public.app_users enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.professional_contacts enable row level security;
alter table public.qualifications enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.directory_profiles enable row level security;
alter table public.contact_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.consents enable row level security;
alter table public.audit_log enable row level security;
alter table public.rate_limits enable row level security;

create policy app_users_select_own_or_staff on public.app_users
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_staff()));

create policy profiles_select_own_or_staff on public.professional_profiles
for select to authenticated
using (owner_user_id = (select auth.uid()) or (select private.is_staff()));
create policy profiles_insert_own on public.professional_profiles
for insert to authenticated
with check (owner_user_id = (select auth.uid()) and status = 'draft');
create policy profiles_update_own_draft on public.professional_profiles
for update to authenticated
using (owner_user_id = (select auth.uid()))
with check (
  owner_user_id = (select auth.uid())
  and status in ('draft', 'submitted', 'changes_requested')
  and reviewed_by is null
);
create policy profiles_staff_all on public.professional_profiles
for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy contacts_owner_or_staff_select on public.professional_contacts
for select to authenticated
using (
  exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id
      and (p.owner_user_id = (select auth.uid()) or (select private.is_staff()))
  )
);
create policy contacts_owner_insert on public.professional_contacts
for insert to authenticated
with check (
  exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id and p.owner_user_id = (select auth.uid())
  )
);
create policy contacts_owner_update on public.professional_contacts
for update to authenticated
using (
  exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id and p.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id and p.owner_user_id = (select auth.uid())
  )
);
create policy contacts_staff_all on public.professional_contacts
for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy qualifications_owner_or_staff_select on public.qualifications
for select to authenticated
using (
  exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id
      and (p.owner_user_id = (select auth.uid()) or (select private.is_staff()))
  )
);
create policy qualifications_owner_insert on public.qualifications
for insert to authenticated
with check (
  status in ('declared', 'pending_review')
  and exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id and p.owner_user_id = (select auth.uid())
  )
);
create policy qualifications_owner_update on public.qualifications
for update to authenticated
using (
  status in ('declared', 'pending_review', 'changes_requested')
  and exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id and p.owner_user_id = (select auth.uid())
  )
)
with check (
  status in ('declared', 'pending_review')
  and reviewed_by is null
  and exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id and p.owner_user_id = (select auth.uid())
  )
);
create policy qualifications_staff_all on public.qualifications
for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy portfolio_owner_or_staff_select on public.portfolio_items
for select to authenticated
using (
  exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id
      and (p.owner_user_id = (select auth.uid()) or (select private.is_staff()))
  )
);
create policy portfolio_owner_insert on public.portfolio_items
for insert to authenticated
with check (
  status = 'pending_review'
  and exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id and p.owner_user_id = (select auth.uid())
  )
);
create policy portfolio_owner_update on public.portfolio_items
for update to authenticated
using (
  status in ('pending_review', 'changes_requested')
  and exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id and p.owner_user_id = (select auth.uid())
  )
)
with check (
  status = 'pending_review'
  and reviewed_by is null
  and exists (
    select 1 from public.professional_profiles p
    where p.id = profile_id and p.owner_user_id = (select auth.uid())
  )
);
create policy portfolio_staff_all on public.portfolio_items
for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy directory_public_read on public.directory_profiles
for select to anon, authenticated
using (not is_demo and published_at <= now());
create policy directory_staff_all on public.directory_profiles
for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()) and not is_demo);

create policy contact_requests_public_insert on public.contact_requests
for insert to anon, authenticated
with check (status = 'new' and not is_demo and tracking_token_hash <> '');
create policy contact_requests_owner_select on public.contact_requests
for select to authenticated
using (
  exists (
    select 1 from public.directory_profiles d
    where d.profile_id = professional_profile_id and d.owner_user_id = (select auth.uid())
  )
  or (select private.is_staff())
);
create policy contact_requests_owner_status_update on public.contact_requests
for update to authenticated
using (
  exists (
    select 1 from public.directory_profiles d
    where d.profile_id = professional_profile_id and d.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.directory_profiles d
    where d.profile_id = professional_profile_id and d.owner_user_id = (select auth.uid())
  )
);
create policy contact_requests_staff_all on public.contact_requests
for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy reviews_public_read on public.reviews
for select to anon, authenticated
using (status = 'published');
create policy reviews_staff_all on public.reviews
for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy consents_owner_read on public.consents
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_staff()));
create policy audit_admin_read on public.audit_log
for select to authenticated
using ((select private.is_admin()));

revoke all on all tables in schema public from anon, authenticated;
grant select on public.directory_profiles to anon, authenticated;
grant insert (
  professional_profile_id,
  requester_name,
  requester_email,
  requester_phone,
  requester_commune,
  requested_service,
  description,
  tracking_token_hash
) on public.contact_requests to anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant select on public.app_users to authenticated;
grant select, insert, update on public.professional_profiles to authenticated;
grant select, insert, update on public.professional_contacts to authenticated;
grant select, insert, update on public.qualifications to authenticated;
grant select, insert, update on public.portfolio_items to authenticated;
grant select, insert, update, delete on public.directory_profiles to authenticated;
grant select, update (status, completed_at) on public.contact_requests to authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant select, insert, update on public.consents to authenticated;
grant select, insert on public.audit_log to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('identity-documents', 'identity-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('qualification-documents', 'qualification-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('profile-images', 'profile-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('gallery-images', 'gallery-images', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('review-evidence', 'review-evidence', false, 8388608, array['application/pdf', 'image/jpeg', 'image/png']),
  ('report-evidence', 'report-evidence', false, 8388608, array['application/pdf', 'image/jpeg', 'image/png']),
  ('quarantine', 'quarantine', false, 10485760, null)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy storage_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id in (
    'identity-documents', 'qualification-documents', 'profile-images',
    'gallery-images', 'review-evidence', 'report-evidence', 'quarantine'
  )
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy storage_owner_read on storage.objects
for select to authenticated
using ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_staff()));
create policy storage_owner_update on storage.objects
for update to authenticated
using ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_staff()))
with check ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_staff()));
create policy storage_owner_delete on storage.objects
for delete to authenticated
using ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_staff()));
create policy storage_approved_gallery_read on storage.objects
for select to anon, authenticated
using (
  bucket_id in ('profile-images', 'gallery-images')
  and (
    exists (
      select 1 from public.portfolio_items item
      where item.storage_path = name and item.status = 'reviewed'
    )
    or exists (
      select 1 from public.directory_profiles profile
      where profile.avatar_path = name and not profile.is_demo
    )
  )
);

comment on table public.directory_profiles is
  'Proyección pública aprobada. Nunca incluir correo, teléfono, documentos ni notas de moderación.';
comment on function private.assign_role_by_email(text, public.app_role, text) is
  'Bootstrap/operación por psql como postgres. No se expone a anon ni authenticated.';

commit;
