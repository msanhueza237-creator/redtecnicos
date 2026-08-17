-- Reclamos públicos y gestión administrativa auditada.

begin;

create type public.complaint_status as enum (
  'new',
  'triaged',
  'investigating',
  'awaiting_information',
  'resolved',
  'dismissed'
);

create type public.complaint_priority as enum ('low', 'medium', 'high', 'urgent');

create type public.complaint_category as enum (
  'profile_information',
  'contact_request',
  'review',
  'professional_conduct',
  'privacy',
  'other'
);

create type public.complaint_related_type as enum (
  'profile',
  'contact_request',
  'review',
  'general'
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  reporter_name text not null check (char_length(reporter_name) between 2 and 100),
  reporter_email text not null check (char_length(reporter_email) <= 254),
  reporter_phone text check (reporter_phone is null or char_length(reporter_phone) between 8 and 24),
  category public.complaint_category not null,
  subject text not null check (char_length(subject) between 5 and 160),
  description text not null check (char_length(description) between 30 and 3000),
  related_type public.complaint_related_type not null default 'general',
  related_reference text check (related_reference is null or char_length(related_reference) <= 160),
  status public.complaint_status not null default 'new',
  priority public.complaint_priority not null default 'medium',
  assigned_to uuid references public.app_users(user_id) on delete set null,
  last_admin_reason text check (last_admin_reason is null or char_length(last_admin_reason) between 8 and 1000),
  resolution_summary text check (resolution_summary is null or char_length(resolution_summary) between 10 and 1500),
  resolved_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index complaints_status_priority_created_idx
  on public.complaints (status, priority, created_at desc)
  where not is_demo;
create index complaints_reporter_recent_idx
  on public.complaints (lower(reporter_email), created_at desc)
  where not is_demo;

create trigger complaints_set_updated_at
before update on public.complaints
for each row execute function private.set_updated_at();

alter table public.complaints enable row level security;

create policy complaints_staff_read on public.complaints
for select to authenticated
using ((select private.is_staff()) and not is_demo);

revoke all on public.complaints from anon, authenticated;
grant select on public.complaints to authenticated;

create or replace function public.create_public_complaint(
  p_reporter_name text,
  p_reporter_email text,
  p_reporter_phone text,
  p_category public.complaint_category,
  p_subject text,
  p_description text,
  p_related_type public.complaint_related_type,
  p_related_reference text,
  p_report_key_hash text,
  p_consent_version text
)
returns table (
  complaint_id uuid,
  complaint_case_number text,
  complaint_status public.complaint_status,
  complaint_created_at timestamptz
)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  normalized_email text := lower(trim(p_reporter_email));
  normalized_phone text := nullif(trim(coalesce(p_reporter_phone, '')), '');
  normalized_reference text := nullif(trim(coalesce(p_related_reference, '')), '');
  email_rate_key text;
  created_complaint public.complaints%rowtype;
  generated_case_number text;
begin
  if char_length(trim(p_reporter_name)) not between 2 and 100
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(normalized_email) > 254
    or (normalized_phone is not null and char_length(normalized_phone) not between 8 and 24)
    or char_length(trim(p_subject)) not between 5 and 160
    or char_length(trim(p_description)) not between 30 and 3000
    or (normalized_reference is not null and char_length(normalized_reference) > 160)
    or p_report_key_hash !~ '^[a-f0-9]{64}$'
    or char_length(trim(p_consent_version)) not between 3 and 40 then
    raise exception 'VALIDATION_ERROR';
  end if;

  email_rate_key := encode(
    extensions.digest(convert_to(normalized_email || ':complaint', 'UTF8'), 'sha256'),
    'hex'
  );
  perform private.consume_rate_limit(email_rate_key, 'complaint_email', 3, 1440);
  perform private.consume_rate_limit(p_report_key_hash, 'complaint_network', 8, 60);

  generated_case_number := 'REC-' || to_char(now(), 'YYYY') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.complaints (
    case_number,
    reporter_name,
    reporter_email,
    reporter_phone,
    category,
    subject,
    description,
    related_type,
    related_reference
  ) values (
    generated_case_number,
    trim(p_reporter_name),
    normalized_email,
    normalized_phone,
    p_category,
    trim(p_subject),
    trim(p_description),
    p_related_type,
    normalized_reference
  ) returning * into created_complaint;

  insert into public.consents (
    subject_email_hash,
    consent_type,
    document_version
  ) values (
    encode(extensions.digest(convert_to(normalized_email, 'UTF8'), 'sha256'), 'hex'),
    'complaint_data_processing',
    trim(p_consent_version)
  );

  insert into public.audit_log (
    actor_user_id, action, entity_type, entity_id, reason, after_data
  ) values (
    null,
    'complaint.created',
    'complaint',
    created_complaint.id::text,
    'Reclamo público recibido.',
    jsonb_build_object(
      'case_number', created_complaint.case_number,
      'category', created_complaint.category,
      'related_type', created_complaint.related_type,
      'status', created_complaint.status,
      'priority', created_complaint.priority
    )
  );

  return query select
    created_complaint.id,
    created_complaint.case_number,
    created_complaint.status,
    created_complaint.created_at;
end;
$$;

revoke all on function public.create_public_complaint(
  text, text, text, public.complaint_category, text, text,
  public.complaint_related_type, text, text, text
) from public;
grant execute on function public.create_public_complaint(
  text, text, text, public.complaint_category, text, text,
  public.complaint_related_type, text, text, text
) to anon, authenticated;

create or replace function public.update_complaint_case(
  p_complaint_id uuid,
  p_status public.complaint_status,
  p_priority public.complaint_priority,
  p_reason text,
  p_resolution_summary text
)
returns public.complaint_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  complaint_record public.complaints%rowtype;
  normalized_resolution text := nullif(trim(coalesce(p_resolution_summary, '')), '');
begin
  if not (select private.is_staff()) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) not between 8 and 1000 then
    raise exception 'Se requiere un motivo de entre 8 y 1000 caracteres.';
  end if;
  if p_status in ('resolved', 'dismissed')
    and coalesce(char_length(normalized_resolution), 0) < 10 then
    raise exception 'La resolución requiere un resumen de al menos 10 caracteres.';
  end if;

  select * into complaint_record
  from public.complaints
  where id = p_complaint_id and not is_demo
  for update;

  if not found then raise exception 'Reclamo no encontrado.'; end if;

  update public.complaints
  set status = p_status,
      priority = p_priority,
      assigned_to = coalesce(assigned_to, (select auth.uid())),
      last_admin_reason = trim(p_reason),
      resolution_summary = case
        when p_status in ('resolved', 'dismissed') then normalized_resolution
        else resolution_summary
      end,
      resolved_at = case
        when p_status in ('resolved', 'dismissed') then now()
        else null
      end
  where id = complaint_record.id;

  insert into public.audit_log (
    actor_user_id, action, entity_type, entity_id, reason, before_data, after_data
  ) values (
    (select auth.uid()),
    'complaint.updated',
    'complaint',
    complaint_record.id::text,
    trim(p_reason),
    jsonb_build_object(
      'status', complaint_record.status,
      'priority', complaint_record.priority,
      'assigned_to', complaint_record.assigned_to
    ),
    jsonb_build_object(
      'status', p_status,
      'priority', p_priority,
      'assigned_to', coalesce(complaint_record.assigned_to, (select auth.uid())),
      'resolution_recorded', normalized_resolution is not null
    )
  );

  return p_status;
end;
$$;

revoke all on function public.update_complaint_case(
  uuid, public.complaint_status, public.complaint_priority, text, text
) from public, anon;
grant execute on function public.update_complaint_case(
  uuid, public.complaint_status, public.complaint_priority, text, text
) to authenticated;

commit;
