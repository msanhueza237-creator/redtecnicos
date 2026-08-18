-- Perfil profesional real, disponibilidad, servicios, identidad y respuestas a evaluaciones.
-- La tabla editable permanece separada de directory_profiles para conservar publicada
-- la última versión aprobada mientras los cambios sensibles esperan moderación.

begin;

alter table public.professional_profiles
  add column if not exists avatar_path text,
  add column if not exists avatar_status public.moderation_state not null default 'declared',
  add column if not exists avatar_review_reason text,
  add column if not exists emergency_available boolean not null default false,
  add column if not exists working_hours text not null default '',
  add column if not exists accepts_new_requests boolean not null default true,
  add column if not exists brands text[] not null default '{}',
  add column if not exists equipment_types text[] not null default '{}',
  add column if not exists issues_invoice boolean not null default false,
  add column if not exists issues_receipt boolean not null default false,
  add column if not exists written_quotes boolean not null default true,
  add column if not exists declared_warranty text not null default '',
  add column if not exists payment_methods text[] not null default '{}',
  add column if not exists identity_verified_at timestamptz,
  add column if not exists identity_verified_by uuid references public.app_users(user_id);

alter table public.professional_profiles
  drop constraint if exists professional_profiles_working_hours_check,
  add constraint professional_profiles_working_hours_check check (char_length(working_hours) <= 180),
  drop constraint if exists professional_profiles_declared_warranty_check,
  add constraint professional_profiles_declared_warranty_check check (char_length(declared_warranty) <= 240),
  drop constraint if exists professional_profiles_brands_check,
  add constraint professional_profiles_brands_check check (cardinality(brands) <= 12),
  drop constraint if exists professional_profiles_equipment_types_check,
  add constraint professional_profiles_equipment_types_check check (cardinality(equipment_types) <= 12),
  drop constraint if exists professional_profiles_payment_methods_check,
  add constraint professional_profiles_payment_methods_check check (cardinality(payment_methods) <= 6);

alter table public.directory_profiles
  add column if not exists emergency_available boolean not null default false,
  add column if not exists working_hours text not null default '',
  add column if not exists accepts_new_requests boolean not null default true,
  add column if not exists brands text[] not null default '{}',
  add column if not exists equipment_types text[] not null default '{}',
  add column if not exists issues_invoice boolean not null default false,
  add column if not exists issues_receipt boolean not null default false,
  add column if not exists written_quotes boolean not null default true,
  add column if not exists declared_warranty text not null default '',
  add column if not exists payment_methods text[] not null default '{}';

alter table public.reviews
  add column if not exists professional_reply text,
  add column if not exists replied_at timestamptz;

alter table public.reviews
  drop constraint if exists reviews_professional_reply_check,
  add constraint reviews_professional_reply_check
    check (professional_reply is null or char_length(professional_reply) between 2 and 800);

create table if not exists public.identity_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.professional_profiles(id) on delete cascade,
  document_type text not null check (document_type in ('identity_document', 'company_tax_document')),
  subject_name text not null check (char_length(subject_name) between 3 and 160),
  document_path text not null unique,
  original_file_name text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  file_size_bytes bigint not null check (file_size_bytes between 1 and 10485760),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  scan_status text not null check (scan_status = 'clean'),
  scanned_at timestamptz not null,
  scan_engine text not null,
  status public.moderation_state not null default 'pending_review',
  review_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.app_users(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists identity_documents_profile_status_idx
  on public.identity_documents(profile_id, status, created_at desc);

drop trigger if exists identity_documents_set_updated_at on public.identity_documents;
create trigger identity_documents_set_updated_at
before update on public.identity_documents
for each row execute function private.set_updated_at();

alter table public.identity_documents enable row level security;

drop policy if exists identity_documents_owner_or_staff_select on public.identity_documents;
create policy identity_documents_owner_or_staff_select on public.identity_documents
for select to authenticated
using (
  (select private.is_staff())
  or exists (
    select 1
    from public.professional_profiles profile
    where profile.id = identity_documents.profile_id
      and profile.owner_user_id = (select auth.uid())
  )
);

revoke all on public.identity_documents from anon, authenticated;
grant select on public.identity_documents to authenticated;

create or replace function private.normalized_text_array(
  source_values text[],
  maximum_items integer,
  maximum_length integer
)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(value order by first_position), '{}'::text[])
  from (
    select trim(item) as value, min(position) as first_position
    from unnest(coalesce(source_values, '{}'::text[])) with ordinality as input(item, position)
    where char_length(trim(item)) between 2 and maximum_length
    group by trim(item)
    order by min(position)
    limit maximum_items
  ) normalized;
$$;

revoke all on function private.normalized_text_array(text[], integer, integer) from public, anon, authenticated;

create or replace function public.update_owned_professional_profile(
  p_display_name text,
  p_headline text,
  p_summary text,
  p_categories text[],
  p_years_experience integer,
  p_public_email text,
  p_public_phone text,
  p_whatsapp_phone text
)
returns public.profile_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_record public.professional_profiles%rowtype;
  safe_categories public.professional_category[];
  next_status public.profile_status;
  normalized_email text := lower(trim(coalesce(p_public_email, '')));
begin
  if (select private.current_app_role()) not in ('technician', 'company') then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_display_name, ''))) not between 2 and 100
    or char_length(trim(coalesce(p_headline, ''))) not between 5 and 160
    or char_length(trim(coalesce(p_summary, ''))) not between 40 and 1600
    or coalesce(p_years_experience, -1) not between 0 and 70
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(trim(coalesce(p_public_phone, ''))) not between 8 and 24
    or char_length(trim(coalesce(p_whatsapp_phone, ''))) not between 8 and 24 then
    raise exception 'VALIDATION_ERROR';
  end if;

  select array_agg(value::public.professional_category order by first_position)
  into safe_categories
  from (
    select trim(item) as value, min(position) as first_position
    from unnest(coalesce(p_categories, '{}'::text[])) with ordinality as input(item, position)
    where trim(item) in ('industrial', 'commercial', 'residential')
    group by trim(item)
    order by min(position)
    limit 3
  ) normalized;
  if coalesce(cardinality(safe_categories), 0) < 1 then raise exception 'Selecciona al menos una categoría.'; end if;

  select * into profile_record
  from public.professional_profiles
  where owner_user_id = (select auth.uid())
  for update;
  if not found then raise exception 'Perfil profesional no encontrado.'; end if;
  if profile_record.status in ('suspended', 'rejected', 'deleted') then
    raise exception 'El estado actual no permite editar el perfil.';
  end if;

  next_status := 'submitted'::public.profile_status;
  update public.professional_profiles
  set display_name = trim(p_display_name),
      headline = trim(p_headline),
      summary = trim(p_summary),
      categories = safe_categories,
      years_experience = p_years_experience,
      status = next_status,
      submitted_at = now(),
      review_reason = null
  where id = profile_record.id;

  update public.app_users
  set display_name = trim(p_display_name),
      phone = trim(p_public_phone)
  where user_id = (select auth.uid());

  insert into public.professional_contacts(profile_id, public_email, public_phone, whatsapp_phone)
  values (profile_record.id, normalized_email, trim(p_public_phone), trim(p_whatsapp_phone))
  on conflict (profile_id) do update set
    public_email = excluded.public_email,
    public_phone = excluded.public_phone,
    whatsapp_phone = excluded.whatsapp_phone,
    updated_at = now();

  insert into public.audit_log(actor_user_id, action, entity_type, entity_id, reason, before_data, after_data)
  values (
    (select auth.uid()), 'profile.main_information_updated', 'professional_profile', profile_record.id::text,
    'Información principal actualizada por el propietario y enviada a revisión.',
    jsonb_build_object('status', profile_record.status, 'display_name', profile_record.display_name),
    jsonb_build_object('status', next_status, 'display_name', trim(p_display_name))
  );
  return next_status;
end;
$$;

revoke all on function public.update_owned_professional_profile(text, text, text, text[], integer, text, text, text) from public, anon;
grant execute on function public.update_owned_professional_profile(text, text, text, text[], integer, text, text, text) to authenticated;

create or replace function public.update_owned_professional_services(
  p_services text[],
  p_specialties text[],
  p_brands text[],
  p_equipment_types text[]
)
returns public.profile_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_record public.professional_profiles%rowtype;
  safe_services text[];
  safe_specialties text[];
  safe_brands text[];
  safe_equipment text[];
begin
  if (select private.current_app_role()) not in ('technician', 'company') then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  select array_agg(value order by first_position)
  into safe_services
  from (
    select trim(item) as value, min(position) as first_position
    from unnest(coalesce(p_services, '{}'::text[])) with ordinality as input(item, position)
    where trim(item) = any(array[
      'Instalación de aire acondicionado', 'Mantención de aire acondicionado',
      'Reparación de aire acondicionado', 'Limpieza de equipos', 'Diagnóstico técnico',
      'Refrigeración comercial', 'Cámaras de frío', 'Electricidad relacionada',
      'Instalación de bombas de condensado', 'Instalación de tuberías de cobre',
      'Detección de fugas', 'Carga de refrigerante'
    ]::text[])
    group by trim(item)
    order by min(position)
    limit 6
  ) normalized;
  if coalesce(cardinality(safe_services), 0) < 1 then raise exception 'Selecciona al menos un servicio.'; end if;

  safe_specialties := private.normalized_text_array(p_specialties, 12, 80);
  safe_brands := private.normalized_text_array(p_brands, 12, 80);
  safe_equipment := private.normalized_text_array(p_equipment_types, 12, 80);

  select * into profile_record
  from public.professional_profiles
  where owner_user_id = (select auth.uid())
  for update;
  if not found then raise exception 'Perfil profesional no encontrado.'; end if;
  if profile_record.status in ('suspended', 'rejected', 'deleted') then
    raise exception 'El estado actual no permite editar los servicios.';
  end if;

  update public.professional_profiles
  set services = safe_services,
      specialties = safe_specialties,
      brands = safe_brands,
      equipment_types = safe_equipment,
      status = 'submitted',
      submitted_at = now(),
      review_reason = null
  where id = profile_record.id;

  insert into public.audit_log(actor_user_id, action, entity_type, entity_id, reason, before_data, after_data)
  values (
    (select auth.uid()), 'profile.services_updated', 'professional_profile', profile_record.id::text,
    'Servicios y especialidades actualizados por el propietario y enviados a revisión.',
    jsonb_build_object('services', profile_record.services),
    jsonb_build_object('services', safe_services, 'specialties', safe_specialties, 'brands', safe_brands, 'equipment_types', safe_equipment)
  );
  return 'submitted'::public.profile_status;
end;
$$;

revoke all on function public.update_owned_professional_services(text[], text[], text[], text[]) from public, anon;
grant execute on function public.update_owned_professional_services(text[], text[], text[], text[]) to authenticated;

create or replace function public.update_owned_professional_preferences(
  p_availability text,
  p_working_hours text,
  p_emergency_available boolean,
  p_accepts_new_requests boolean,
  p_issues_invoice boolean,
  p_issues_receipt boolean,
  p_written_quotes boolean,
  p_declared_warranty text,
  p_payment_methods text[]
)
returns public.profile_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_record public.professional_profiles%rowtype;
  safe_payment_methods text[];
begin
  if (select private.current_app_role()) not in ('technician', 'company') then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if trim(coalesce(p_availability, '')) not in ('Disponible esta semana', 'Agenda limitada', 'Solo emergencias', 'No disponible temporalmente')
    or char_length(trim(coalesce(p_working_hours, ''))) > 180
    or char_length(trim(coalesce(p_declared_warranty, ''))) > 240 then
    raise exception 'VALIDATION_ERROR';
  end if;

  select coalesce(array_agg(value order by first_position), '{}'::text[])
  into safe_payment_methods
  from (
    select trim(item) as value, min(position) as first_position
    from unnest(coalesce(p_payment_methods, '{}'::text[])) with ordinality as input(item, position)
    where trim(item) = any(array['Transferencia', 'Tarjeta', 'Efectivo', 'Link de pago']::text[])
    group by trim(item)
    order by min(position)
    limit 4
  ) normalized;

  select * into profile_record
  from public.professional_profiles
  where owner_user_id = (select auth.uid())
  for update;
  if not found then raise exception 'Perfil profesional no encontrado.'; end if;
  if profile_record.status in ('suspended', 'rejected', 'deleted') then
    raise exception 'El estado actual no permite editar la configuración.';
  end if;

  update public.professional_profiles
  set availability = trim(p_availability),
      working_hours = trim(coalesce(p_working_hours, '')),
      emergency_available = coalesce(p_emergency_available, false),
      accepts_new_requests = coalesce(p_accepts_new_requests, false),
      issues_invoice = coalesce(p_issues_invoice, false),
      issues_receipt = coalesce(p_issues_receipt, false),
      written_quotes = coalesce(p_written_quotes, false),
      declared_warranty = trim(coalesce(p_declared_warranty, '')),
      payment_methods = safe_payment_methods,
      status = 'submitted',
      submitted_at = now(),
      review_reason = null
  where id = profile_record.id;

  -- La disponibilidad operativa debe cambiar de inmediato para evitar solicitudes
  -- que el profesional no puede atender. Las declaraciones comerciales esperan aprobación.
  update public.directory_profiles
  set availability = trim(p_availability),
      working_hours = trim(coalesce(p_working_hours, '')),
      emergency_available = coalesce(p_emergency_available, false),
      accepts_new_requests = coalesce(p_accepts_new_requests, false),
      updated_at = now()
  where profile_id = profile_record.id;

  insert into public.audit_log(actor_user_id, action, entity_type, entity_id, reason, before_data, after_data)
  values (
    (select auth.uid()), 'profile.preferences_updated', 'professional_profile', profile_record.id::text,
    'Disponibilidad y datos comerciales actualizados por el propietario.',
    jsonb_build_object('availability', profile_record.availability, 'accepts_new_requests', profile_record.accepts_new_requests),
    jsonb_build_object('availability', trim(p_availability), 'accepts_new_requests', coalesce(p_accepts_new_requests, false))
  );
  return 'submitted'::public.profile_status;
end;
$$;

revoke all on function public.update_owned_professional_preferences(text, text, boolean, boolean, boolean, boolean, boolean, text, text[]) from public, anon;
grant execute on function public.update_owned_professional_preferences(text, text, boolean, boolean, boolean, boolean, boolean, text, text[]) to authenticated;

create or replace function public.set_owned_profile_avatar(p_avatar_path text)
returns public.profile_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_record public.professional_profiles%rowtype;
begin
  if (select private.current_app_role()) not in ('technician', 'company') then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if p_avatar_path is null
    or (storage.foldername(p_avatar_path))[1] <> (select auth.uid())::text
    or p_avatar_path !~ '^[0-9a-f-]{36}/avatar-[0-9a-f-]{36}\.webp$' then
    raise exception 'Ruta de imagen no válida.';
  end if;

  select * into profile_record
  from public.professional_profiles
  where owner_user_id = (select auth.uid())
  for update;
  if not found then raise exception 'Perfil profesional no encontrado.'; end if;
  if profile_record.status in ('suspended', 'rejected', 'deleted') then
    raise exception 'El estado actual no permite cambiar la fotografía.';
  end if;

  update public.professional_profiles
  set avatar_path = p_avatar_path,
      avatar_status = 'pending_review',
      avatar_review_reason = null,
      status = 'submitted',
      submitted_at = now(),
      review_reason = null
  where id = profile_record.id;

  insert into public.audit_log(actor_user_id, action, entity_type, entity_id, reason, before_data, after_data)
  values (
    (select auth.uid()), 'profile.avatar_submitted', 'professional_profile', profile_record.id::text,
    'Nueva fotografía profesional enviada a revisión.',
    jsonb_build_object('avatar_status', profile_record.avatar_status),
    jsonb_build_object('avatar_status', 'pending_review')
  );
  return 'submitted'::public.profile_status;
end;
$$;

revoke all on function public.set_owned_profile_avatar(text) from public, anon;
grant execute on function public.set_owned_profile_avatar(text) to authenticated;

create or replace function public.reply_to_owned_review(
  target_review_id uuid,
  reply_text text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  review_record public.reviews%rowtype;
begin
  if (select private.current_app_role()) not in ('technician', 'company') then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(reply_text, ''))) not between 2 and 800 then
    raise exception 'La respuesta debe tener entre 2 y 800 caracteres.';
  end if;

  select review.* into review_record
  from public.reviews review
  join public.directory_profiles directory on directory.profile_id = review.professional_profile_id
  where review.id = target_review_id
    and directory.owner_user_id = (select auth.uid())
  for update of review;
  if not found then raise exception 'Evaluación no encontrada.'; end if;
  if review_record.status <> 'published' then raise exception 'Solo puedes responder evaluaciones publicadas.'; end if;
  if review_record.professional_reply is not null then raise exception 'Esta evaluación ya tiene una respuesta.'; end if;

  update public.reviews
  set professional_reply = trim(reply_text), replied_at = now(), updated_at = now()
  where id = target_review_id;

  insert into public.audit_log(actor_user_id, action, entity_type, entity_id, reason, after_data)
  values (
    (select auth.uid()), 'review.professional_replied', 'review', target_review_id::text,
    'Respuesta pública registrada por el profesional.',
    jsonb_build_object('reply_length', char_length(trim(reply_text)))
  );
  return trim(reply_text);
end;
$$;

revoke all on function public.reply_to_owned_review(uuid, text) from public, anon;
grant execute on function public.reply_to_owned_review(uuid, text) to authenticated;

create or replace function public.list_owned_professional_reviews()
returns table (
  review_id uuid,
  request_id uuid,
  customer_name text,
  requested_service text,
  requester_commune text,
  review_rating smallint,
  review_comment text,
  would_recommend boolean,
  review_status public.review_state,
  professional_reply text,
  replied_at timestamptz,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    review.id,
    request.id,
    request.requester_name,
    request.requested_service,
    request.requester_commune,
    review.rating,
    review.comment,
    review.would_recommend,
    review.status,
    review.professional_reply,
    review.replied_at,
    review.created_at
  from public.reviews review
  join public.contact_requests request on request.id = review.contact_request_id
  join public.directory_profiles directory on directory.profile_id = review.professional_profile_id
  where directory.owner_user_id = (select auth.uid())
    and (select private.current_app_role()) in ('technician', 'company')
  order by review.created_at desc;
$$;

revoke all on function public.list_owned_professional_reviews() from public, anon;
grant execute on function public.list_owned_professional_reviews() to authenticated;

create or replace function public.list_public_profile_reviews(
  p_profile_id uuid,
  p_limit integer default 20
)
returns table (
  review_id uuid,
  review_rating smallint,
  review_comment text,
  would_recommend boolean,
  requester_commune text,
  requested_service text,
  professional_reply text,
  replied_at timestamptz,
  published_at timestamptz
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    review.id,
    review.rating,
    review.comment,
    review.would_recommend,
    request.requester_commune,
    request.requested_service,
    review.professional_reply,
    review.replied_at,
    coalesce(review.moderated_at, review.created_at)
  from public.reviews review
  join public.contact_requests request on request.id = review.contact_request_id
  join public.directory_profiles directory on directory.profile_id = review.professional_profile_id
  where review.professional_profile_id = p_profile_id
    and review.status = 'published'
    and directory.is_published
    and not directory.is_demo
  order by coalesce(review.moderated_at, review.created_at) desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

revoke all on function public.list_public_profile_reviews(uuid, integer) from public;
grant execute on function public.list_public_profile_reviews(uuid, integer) to anon, authenticated;

create or replace function public.moderate_identity_document(
  target_document_id uuid,
  decision_key text,
  decision_reason text
)
returns public.moderation_state
language plpgsql
security definer
set search_path = ''
as $$
declare
  document_record public.identity_documents%rowtype;
  next_status public.moderation_state;
  still_verified boolean;
begin
  if not (select private.is_staff()) then raise exception 'No autorizado.' using errcode = '42501'; end if;
  if char_length(trim(coalesce(decision_reason, ''))) < 8 then raise exception 'Se requiere un motivo de al menos 8 caracteres.'; end if;
  if decision_key not in ('approve', 'request_changes', 'reject') then raise exception 'Decisión no válida.'; end if;

  select * into document_record
  from public.identity_documents
  where id = target_document_id
  for update;
  if not found then raise exception 'Documento no encontrado.'; end if;
  if document_record.status not in ('pending_review', 'reviewed', 'changes_requested') then
    raise exception 'El estado actual no permite esta decisión.';
  end if;
  if decision_key = 'approve' and document_record.scan_status <> 'clean' then
    raise exception 'El documento no tiene un análisis de seguridad válido.';
  end if;

  next_status := case decision_key
    when 'approve' then 'reviewed'::public.moderation_state
    when 'request_changes' then 'changes_requested'::public.moderation_state
    else 'rejected'::public.moderation_state
  end;

  update public.identity_documents
  set status = next_status,
      review_reason = trim(decision_reason),
      reviewed_at = now(),
      reviewed_by = (select auth.uid()),
      updated_at = now()
  where id = target_document_id;

  select exists (
    select 1 from public.identity_documents
    where profile_id = document_record.profile_id and status = 'reviewed'
  ) into still_verified;

  update public.professional_profiles
  set identity_verified_at = case when still_verified then coalesce(identity_verified_at, now()) else null end,
      identity_verified_by = case when still_verified then (select auth.uid()) else null end,
      status = case
        when still_verified and status = 'approved' then 'verified'::public.profile_status
        when not still_verified and status = 'verified' then 'approved'::public.profile_status
        else status
      end
  where id = document_record.profile_id;

  update public.directory_profiles
  set is_verified = still_verified,
      badges = case
        when still_verified and not ('Identidad revisada' = any(badges)) then array_append(badges, 'Identidad revisada')
        when not still_verified then array_remove(badges, 'Identidad revisada')
        else badges
      end,
      updated_at = now()
  where profile_id = document_record.profile_id;

  insert into public.audit_log(actor_user_id, action, entity_type, entity_id, reason, before_data, after_data)
  values (
    (select auth.uid()), 'identity_document.' || decision_key, 'identity_document', target_document_id::text,
    trim(decision_reason),
    jsonb_build_object('status', document_record.status),
    jsonb_build_object('status', next_status, 'identity_verified', still_verified)
  );
  return next_status;
end;
$$;

revoke all on function public.moderate_identity_document(uuid, text, text) from public, anon;
grant execute on function public.moderate_identity_document(uuid, text, text) to authenticated;

-- Incorpora los nuevos campos a la proyección pública únicamente al aprobar.
create or replace function public.moderate_professional_profile(
  target_profile_id uuid,
  decision_key text,
  decision_reason text
)
returns public.profile_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_record public.professional_profiles%rowtype;
  next_status public.profile_status;
  public_slug text;
  reviewed_qualifications jsonb;
  reviewed_portfolio jsonb;
  public_badges text[];
begin
  if not (select private.is_staff()) then raise exception 'No autorizado.' using errcode = '42501'; end if;
  if char_length(trim(coalesce(decision_reason, ''))) < 8 then raise exception 'Se requiere un motivo de al menos 8 caracteres.'; end if;
  if decision_key not in ('approve', 'request_changes', 'reject') then raise exception 'Decisión no válida.'; end if;

  select * into profile_record
  from public.professional_profiles
  where id = target_profile_id
  for update;
  if not found then raise exception 'Postulación no encontrada.'; end if;
  if profile_record.status not in ('submitted', 'under_review', 'changes_requested', 'approved', 'verified') then
    raise exception 'El estado actual no permite esta decisión.';
  end if;

  next_status := case decision_key
    when 'approve' then case when profile_record.identity_verified_at is not null then 'verified'::public.profile_status else 'approved'::public.profile_status end
    when 'request_changes' then 'changes_requested'::public.profile_status
    else 'rejected'::public.profile_status
  end;

  if decision_key = 'approve' then
    if profile_record.region_code is null
      or cardinality(profile_record.categories) = 0
      or cardinality(profile_record.commune_codes) = 0
      or cardinality(profile_record.services) = 0
      or char_length(profile_record.summary) < 40 then
      raise exception 'La postulación no contiene la información mínima para publicarse.';
    end if;

    public_slug := coalesce(profile_record.slug, '');
    if public_slug = '' then
      public_slug := trim(both '-' from regexp_replace(lower(profile_record.display_name), '[^a-z0-9]+', '-', 'g'));
      if char_length(public_slug) < 2 then public_slug := 'profesional'; end if;
      public_slug := left(public_slug, 60) || '-' || left(profile_record.id::text, 8);
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
      'type', qualification_type, 'title', title, 'institution', institution,
      'issuedYear', issued_year, 'expiresAt', expires_at
    ) order by issued_year desc), '[]'::jsonb)
    into reviewed_qualifications
    from public.qualifications
    where profile_id = target_profile_id and status = 'reviewed';

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'title', title, 'category', category, 'description', description,
      'storagePath', storage_path, 'altText', alt_text, 'displayOrder', display_order
    ) order by display_order), '[]'::jsonb)
    into reviewed_portfolio
    from public.portfolio_items
    where profile_id = target_profile_id and status = 'reviewed';

    select coalesce(badges, '{}'::text[])
    into public_badges
    from public.directory_profiles
    where profile_id = target_profile_id;
    public_badges := coalesce(public_badges, '{}'::text[]);
    if profile_record.identity_verified_at is not null and not ('Identidad revisada' = any(public_badges)) then
      public_badges := array_append(public_badges, 'Identidad revisada');
    elsif profile_record.identity_verified_at is null then
      public_badges := array_remove(public_badges, 'Identidad revisada');
    end if;

    insert into public.directory_profiles (
      profile_id, owner_user_id, slug, kind, display_name, headline, summary,
      categories, region_code, commune_codes, services, specialties,
      years_experience, modalities, has_vehicle, availability, score,
      qualifications, portfolio, avatar_path, is_verified, is_demo, published_at,
      emergency_available, working_hours, accepts_new_requests, brands,
      equipment_types, issues_invoice, issues_receipt, written_quotes,
      declared_warranty, payment_methods, badges
    ) values (
      profile_record.id, profile_record.owner_user_id, public_slug,
      profile_record.kind, profile_record.display_name, profile_record.headline,
      profile_record.summary, profile_record.categories, profile_record.region_code,
      profile_record.commune_codes, profile_record.services, profile_record.specialties,
      profile_record.years_experience, profile_record.modalities,
      profile_record.has_vehicle, profile_record.availability, 15,
      reviewed_qualifications, reviewed_portfolio, profile_record.avatar_path,
      profile_record.identity_verified_at is not null, false, now(),
      profile_record.emergency_available, profile_record.working_hours,
      profile_record.accepts_new_requests, profile_record.brands,
      profile_record.equipment_types, profile_record.issues_invoice,
      profile_record.issues_receipt, profile_record.written_quotes,
      profile_record.declared_warranty, profile_record.payment_methods, public_badges
    )
    on conflict (profile_id) do update set
      slug = excluded.slug,
      kind = excluded.kind,
      display_name = excluded.display_name,
      headline = excluded.headline,
      summary = excluded.summary,
      categories = excluded.categories,
      region_code = excluded.region_code,
      commune_codes = excluded.commune_codes,
      services = excluded.services,
      specialties = excluded.specialties,
      years_experience = excluded.years_experience,
      modalities = excluded.modalities,
      has_vehicle = excluded.has_vehicle,
      availability = excluded.availability,
      qualifications = excluded.qualifications,
      portfolio = excluded.portfolio,
      avatar_path = excluded.avatar_path,
      is_verified = excluded.is_verified,
      emergency_available = excluded.emergency_available,
      working_hours = excluded.working_hours,
      accepts_new_requests = excluded.accepts_new_requests,
      brands = excluded.brands,
      equipment_types = excluded.equipment_types,
      issues_invoice = excluded.issues_invoice,
      issues_receipt = excluded.issues_receipt,
      written_quotes = excluded.written_quotes,
      declared_warranty = excluded.declared_warranty,
      payment_methods = excluded.payment_methods,
      badges = excluded.badges,
      published_at = coalesce(directory_profiles.published_at, excluded.published_at),
      updated_at = now();

    update public.professional_profiles
    set slug = public_slug,
        avatar_status = case when avatar_path is null then 'declared'::public.moderation_state else 'reviewed'::public.moderation_state end,
        avatar_review_reason = null
    where id = target_profile_id;
  elsif decision_key = 'request_changes' and profile_record.avatar_status = 'pending_review' then
    update public.professional_profiles
    set avatar_status = 'changes_requested', avatar_review_reason = trim(decision_reason)
    where id = target_profile_id;
  elsif decision_key = 'reject' and profile_record.avatar_status = 'pending_review' then
    update public.professional_profiles
    set avatar_status = 'rejected', avatar_review_reason = trim(decision_reason)
    where id = target_profile_id;
  end if;

  if decision_key = 'reject' then
    update public.directory_profiles
    set is_published = false,
        updated_at = now()
    where profile_id = target_profile_id;
  end if;

  update public.professional_profiles
  set status = next_status,
      reviewed_at = now(),
      reviewed_by = (select auth.uid()),
      review_reason = trim(decision_reason)
  where id = target_profile_id;

  insert into public.audit_log(actor_user_id, action, entity_type, entity_id, reason, before_data, after_data)
  values (
    (select auth.uid()), 'profile.' || decision_key, 'professional_profile', target_profile_id::text,
    trim(decision_reason), jsonb_build_object('status', profile_record.status), jsonb_build_object('status', next_status)
  );
  return next_status;
end;
$$;

revoke all on function public.moderate_professional_profile(uuid, text, text) from public, anon;
grant execute on function public.moderate_professional_profile(uuid, text, text) to authenticated;

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
      and directory.accepts_new_requests
      and not directory.is_demo
      and directory.published_at <= now()
  ) then
    raise exception 'PROFESSIONAL_NOT_AVAILABLE';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_contact_request_public_profile() from public, anon, authenticated;

commit;
