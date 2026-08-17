-- Flujo real y privado de títulos, capacitaciones y sus respaldos documentales.
-- Los archivos finales solo pueden ser escritos por el backend con service_role
-- después de pasar por cuarentena, validación de firma y análisis ClamAV.

begin;

alter table public.qualifications
  add column if not exists original_file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists sha256 text,
  add column if not exists scan_status text not null default 'legacy_unverified',
  add column if not exists scanned_at timestamptz,
  add column if not exists scan_engine text;

alter table public.qualifications
  drop constraint if exists qualifications_mime_type_check,
  add constraint qualifications_mime_type_check
    check (mime_type is null or mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  drop constraint if exists qualifications_file_size_bytes_check,
  add constraint qualifications_file_size_bytes_check
    check (file_size_bytes is null or file_size_bytes between 1 and 10485760),
  drop constraint if exists qualifications_sha256_check,
  add constraint qualifications_sha256_check
    check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  drop constraint if exists qualifications_scan_status_check,
  add constraint qualifications_scan_status_check
    check (scan_status in ('clean', 'legacy_unverified'));

create unique index if not exists qualifications_document_path_unique
  on public.qualifications(document_path)
  where document_path is not null;

drop policy if exists qualifications_owner_insert on public.qualifications;
drop policy if exists qualifications_owner_update on public.qualifications;
revoke insert, update, delete on public.qualifications from authenticated;
grant select on public.qualifications to authenticated;

-- El cliente autenticado solo escribe en cuarentena u otros buckets de medios.
-- qualification-documents e identity-documents quedan reservados a service_role.
drop policy if exists storage_owner_insert on storage.objects;
create policy storage_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id in (
    'profile-images', 'gallery-images', 'review-evidence',
    'report-evidence', 'quarantine'
  )
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists storage_owner_update on storage.objects;
create policy storage_owner_update on storage.objects
for update to authenticated
using (
  (select private.is_staff())
  or (
    bucket_id not in ('identity-documents', 'qualification-documents')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
)
with check (
  (select private.is_staff())
  or (
    bucket_id not in ('identity-documents', 'qualification-documents')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
);

drop policy if exists storage_owner_delete on storage.objects;
create policy storage_owner_delete on storage.objects
for delete to authenticated
using (
  (select private.is_staff())
  or (
    bucket_id not in ('identity-documents', 'qualification-documents')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
);

create or replace function public.moderate_qualification(
  target_qualification_id uuid,
  decision_key text,
  decision_reason text
)
returns public.moderation_state
language plpgsql
security definer
set search_path = ''
as $$
declare
  qualification_record public.qualifications%rowtype;
  next_status public.moderation_state;
  reviewed_qualifications jsonb;
begin
  if not (select private.is_staff()) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(decision_reason, ''))) < 8 then
    raise exception 'Se requiere un motivo de al menos 8 caracteres.';
  end if;
  if decision_key not in ('approve', 'request_changes', 'reject') then
    raise exception 'Decisión no válida.';
  end if;

  select * into qualification_record
  from public.qualifications
  where id = target_qualification_id
  for update;
  if not found then raise exception 'Antecedente no encontrado.'; end if;

  if qualification_record.status not in ('declared', 'pending_review', 'changes_requested', 'reviewed') then
    raise exception 'El estado actual no permite esta decisión.';
  end if;

  if decision_key = 'approve' then
    if qualification_record.scan_status <> 'clean'
      or qualification_record.document_path is null
      or not exists (
        select 1 from storage.objects
        where bucket_id = 'qualification-documents'
          and name = qualification_record.document_path
      ) then
      raise exception 'El documento no tiene un análisis de seguridad válido.';
    end if;
    next_status := 'reviewed'::public.moderation_state;
  elsif decision_key = 'request_changes' then
    next_status := 'changes_requested'::public.moderation_state;
  else
    next_status := 'rejected'::public.moderation_state;
  end if;

  update public.qualifications
  set status = next_status,
      review_reason = trim(decision_reason),
      reviewed_at = now(),
      reviewed_by = (select auth.uid()),
      updated_at = now()
  where id = target_qualification_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'type', qualification_type,
    'title', title,
    'institution', institution,
    'issuedYear', issued_year,
    'expiresAt', expires_at
  ) order by issued_year desc), '[]'::jsonb)
  into reviewed_qualifications
  from public.qualifications
  where profile_id = qualification_record.profile_id
    and status = 'reviewed';

  update public.directory_profiles
  set qualifications = reviewed_qualifications,
      updated_at = now()
  where profile_id = qualification_record.profile_id;

  insert into public.audit_log (
    actor_user_id, action, entity_type, entity_id, reason, before_data, after_data
  ) values (
    (select auth.uid()),
    'qualification.' || decision_key,
    'qualification',
    target_qualification_id::text,
    trim(decision_reason),
    jsonb_build_object('status', qualification_record.status),
    jsonb_build_object('status', next_status, 'scan_status', qualification_record.scan_status)
  );

  return next_status;
end;
$$;

revoke all on function public.moderate_qualification(uuid, text, text) from public, anon;
grant execute on function public.moderate_qualification(uuid, text, text) to authenticated;

commit;
