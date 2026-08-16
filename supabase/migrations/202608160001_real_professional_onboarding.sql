-- Registro profesional real y moderación auditada.
-- No publica datos de contacto ni documentos en directory_profiles.

begin;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_kind text;
  safe_role public.app_role;
  safe_kind public.professional_kind;
  safe_name text;
  safe_display_name text;
  safe_phone text;
  safe_category public.professional_category;
  safe_years integer := 0;
  safe_summary text;
  safe_region text;
  safe_communes text[] := '{}';
  safe_services text[] := '{}';
  safe_modalities text[] := '{}';
  safe_vehicle boolean := false;
  complete_registration boolean := false;
  created_profile_id uuid;
begin
  requested_kind := coalesce(metadata ->> 'entity_kind', 'technician');
  safe_role := case when requested_kind = 'company' then 'company'::public.app_role else 'technician'::public.app_role end;
  safe_kind := case when requested_kind = 'company' then 'company'::public.professional_kind else 'technician'::public.professional_kind end;

  safe_name := left(trim(coalesce(metadata ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))), 100);
  if char_length(safe_name) < 2 then safe_name := 'Profesional'; end if;

  safe_display_name := left(trim(coalesce(metadata ->> 'professional_display_name', safe_name)), 100);
  if char_length(safe_display_name) < 2 then safe_display_name := safe_name; end if;

  safe_phone := left(trim(coalesce(metadata ->> 'phone', '')), 30);
  if safe_phone !~ '^\+?56[[:space:]]?9[[:space:]]?[0-9]{4}[[:space:]]?[0-9]{4}$' then
    safe_phone := null;
  end if;

  safe_category := case metadata ->> 'professional_category'
    when 'industrial' then 'industrial'::public.professional_category
    when 'commercial' then 'commercial'::public.professional_category
    when 'residential' then 'residential'::public.professional_category
    else null
  end;

  if coalesce(metadata ->> 'years_experience', '') ~ '^[0-9]{1,2}$' then
    safe_years := least(70, greatest(0, (metadata ->> 'years_experience')::integer));
  end if;

  safe_summary := left(trim(coalesce(metadata ->> 'summary', '')), 600);
  safe_region := case metadata ->> 'region_code'
    when 'CL-AP' then 'CL-AP' when 'CL-TA' then 'CL-TA'
    when 'CL-AN' then 'CL-AN' when 'CL-AT' then 'CL-AT'
    when 'CL-CO' then 'CL-CO' when 'CL-VS' then 'CL-VS'
    when 'CL-RM' then 'CL-RM' when 'CL-LI' then 'CL-LI'
    when 'CL-ML' then 'CL-ML' when 'CL-NB' then 'CL-NB'
    when 'CL-BI' then 'CL-BI' when 'CL-AR' then 'CL-AR'
    when 'CL-LR' then 'CL-LR' when 'CL-LL' then 'CL-LL'
    when 'CL-AI' then 'CL-AI' when 'CL-MA' then 'CL-MA'
    else null
  end;

  safe_communes := array(
    select left(trim(value), 100)
    from jsonb_array_elements_text(
      case when jsonb_typeof(metadata -> 'commune_codes') = 'array' then metadata -> 'commune_codes' else '[]'::jsonb end
    ) as item(value)
    where char_length(trim(value)) between 2 and 100
    limit 8
  );

  safe_services := array(
    select value
    from jsonb_array_elements_text(
      case when jsonb_typeof(metadata -> 'services') = 'array' then metadata -> 'services' else '[]'::jsonb end
    ) as item(value)
    where value = any(array[
      'Instalación de aire acondicionado', 'Mantención de aire acondicionado',
      'Reparación de aire acondicionado', 'Limpieza de equipos',
      'Diagnóstico técnico', 'Refrigeración comercial', 'Cámaras de frío',
      'Electricidad relacionada', 'Instalación de bombas de condensado',
      'Instalación de tuberías de cobre', 'Detección de fugas', 'Carga de refrigerante'
    ]::text[])
    limit 6
  );

  safe_modalities := array(
    select value
    from jsonb_array_elements_text(
      case when jsonb_typeof(metadata -> 'modalities') = 'array' then metadata -> 'modalities' else '[]'::jsonb end
    ) as item(value)
    where value = any(array['Atención a domicilio', 'Atención en taller', 'Diagnóstico remoto inicial']::text[])
    limit 3
  );

  safe_vehicle := lower(coalesce(metadata ->> 'has_vehicle', 'false')) in ('true', '1', 'yes');
  complete_registration :=
    metadata ->> 'registration_version' = 'professional-onboarding-v1'
    and metadata ->> 'consent_version' = 'professional-terms-v1'
    and safe_phone is not null
    and safe_category is not null
    and char_length(safe_summary) >= 40
    and safe_region is not null
    and cardinality(safe_communes) >= 1
    and cardinality(safe_services) >= 1
    and cardinality(safe_modalities) >= 1;

  insert into public.app_users (user_id, role, display_name, phone)
  values (new.id, safe_role, safe_name, safe_phone);

  insert into public.professional_profiles (
    owner_user_id, kind, display_name, headline, summary, categories,
    region_code, commune_codes, services, years_experience, modalities,
    has_vehicle, status, submitted_at
  )
  values (
    new.id,
    safe_kind,
    safe_display_name,
    case when safe_kind = 'company' then 'Empresa de refrigeración y climatización' else 'Técnico en refrigeración y climatización' end,
    safe_summary,
    case when safe_category is null then '{}'::public.professional_category[] else array[safe_category] end,
    safe_region,
    safe_communes,
    safe_services,
    safe_years,
    safe_modalities,
    safe_vehicle,
    case when complete_registration then 'submitted'::public.profile_status else 'draft'::public.profile_status end,
    case when complete_registration then now() else null end
  )
  returning id into created_profile_id;

  if complete_registration then
    insert into public.professional_contacts (profile_id, public_email, public_phone, whatsapp_phone)
    values (created_profile_id, lower(trim(new.email)), safe_phone, safe_phone);

    insert into public.consents (user_id, consent_type, document_version)
    values (new.id, 'professional_registration', 'professional-terms-v1');

    insert into public.audit_log (actor_user_id, action, entity_type, entity_id, reason, after_data)
    values (
      new.id,
      'profile.submitted',
      'professional_profile',
      created_profile_id::text,
      'Postulación enviada durante el registro profesional.',
      jsonb_build_object('status', 'submitted', 'registration_version', 'professional-onboarding-v1')
    );
  end if;

  return new;
end;
$$;

drop policy if exists profiles_update_own_draft on public.professional_profiles;
create policy profiles_update_own_draft on public.professional_profiles
for update to authenticated
using (
  owner_user_id = (select auth.uid())
  and status in ('draft', 'submitted', 'changes_requested')
)
with check (
  owner_user_id = (select auth.uid())
  and status in ('draft', 'submitted', 'changes_requested')
);

revoke update on public.professional_profiles from authenticated;
grant update (
  display_name, headline, summary, categories, region_code, commune_codes,
  services, specialties, years_experience, modalities, has_vehicle,
  availability, status, submitted_at
) on public.professional_profiles to authenticated;

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

  select * into profile_record
  from public.professional_profiles
  where id = target_profile_id
  for update;
  if not found then raise exception 'Postulación no encontrada.'; end if;

  if profile_record.status not in ('submitted', 'under_review', 'changes_requested', 'approved') then
    raise exception 'El estado actual no permite esta decisión.';
  end if;

  next_status := case decision_key
    when 'approve' then 'approved'::public.profile_status
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
      'type', qualification_type,
      'title', title,
      'institution', institution,
      'issuedYear', issued_year,
      'expiresAt', expires_at
    ) order by issued_year desc), '[]'::jsonb)
    into reviewed_qualifications
    from public.qualifications
    where profile_id = target_profile_id and status = 'reviewed';

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id,
      'title', title,
      'category', category,
      'description', description,
      'storagePath', storage_path,
      'altText', alt_text,
      'displayOrder', display_order
    ) order by display_order), '[]'::jsonb)
    into reviewed_portfolio
    from public.portfolio_items
    where profile_id = target_profile_id and status = 'reviewed';

    insert into public.directory_profiles (
      profile_id, owner_user_id, slug, kind, display_name, headline, summary,
      categories, region_code, commune_codes, services, specialties,
      years_experience, modalities, has_vehicle, availability, score,
      qualifications, portfolio, is_verified, is_demo, published_at
    ) values (
      profile_record.id, profile_record.owner_user_id, public_slug,
      profile_record.kind, profile_record.display_name, profile_record.headline,
      profile_record.summary, profile_record.categories, profile_record.region_code,
      profile_record.commune_codes, profile_record.services, profile_record.specialties,
      profile_record.years_experience, profile_record.modalities,
      profile_record.has_vehicle, profile_record.availability, 15,
      reviewed_qualifications, reviewed_portfolio, false, false, now()
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
      published_at = coalesce(directory_profiles.published_at, excluded.published_at),
      updated_at = now();

    update public.professional_profiles set slug = public_slug where id = target_profile_id;
  end if;

  update public.professional_profiles
  set status = next_status,
      reviewed_at = now(),
      reviewed_by = (select auth.uid()),
      review_reason = trim(decision_reason)
  where id = target_profile_id;

  insert into public.audit_log (
    actor_user_id, action, entity_type, entity_id, reason, before_data, after_data
  ) values (
    (select auth.uid()),
    'profile.' || decision_key,
    'professional_profile',
    target_profile_id::text,
    trim(decision_reason),
    jsonb_build_object('status', profile_record.status),
    jsonb_build_object('status', next_status)
  );

  return next_status;
end;
$$;

revoke all on function public.moderate_professional_profile(uuid, text, text) from public, anon;
grant execute on function public.moderate_professional_profile(uuid, text, text) to authenticated;

commit;
