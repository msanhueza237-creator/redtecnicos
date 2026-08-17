begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'visibility-test@redtecnicos.invalid', '', now(),
  '{}'::jsonb, '{"display_name":"Perfil de visibilidad"}'::jsonb, now(), now()
);

update public.professional_profiles
set id = '20000000-0000-0000-0000-000000000001',
    slug = 'perfil-visibilidad-test',
    display_name = 'Perfil de visibilidad',
    headline = 'Técnico de prueba',
    summary = repeat('Descripción segura de prueba. ', 3),
    categories = array['residential'::public.professional_category],
    region_code = 'CL-RM',
    commune_codes = array['Santiago'],
    services = array['Instalación de aire acondicionado'],
    years_experience = 5,
    modalities = array['Atención a domicilio'],
    status = 'approved'
where owner_user_id = '10000000-0000-0000-0000-000000000001';

insert into public.directory_profiles (
  profile_id, owner_user_id, slug, kind, display_name, headline, summary,
  categories, region_code, commune_codes, services, specialties,
  years_experience, modalities, has_vehicle, is_published, is_demo
) values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'perfil-visibilidad-test', 'technician', 'Perfil de visibilidad',
  'Técnico de prueba', repeat('Descripción segura de prueba. ', 3),
  array['residential'::public.professional_category], 'CL-RM', array['Santiago'],
  array['Instalación de aire acondicionado'], '{}', 5, array['Domiciliaria'],
  false, true, false
);

update public.professional_profiles
set status = 'rejected'
where id = '20000000-0000-0000-0000-000000000001';

select is(
  (select is_published from public.directory_profiles where profile_id = '20000000-0000-0000-0000-000000000001'),
  false,
  'Rechazar conserva la fila histórica pero la retira del directorio'
);

set local role anon;
select is(
  (select count(*) from public.directory_profiles where profile_id = '20000000-0000-0000-0000-000000000001'),
  0::bigint,
  'Un visitante no puede leer un perfil retirado'
);
reset role;

update public.professional_profiles
set status = 'approved'
where id = '20000000-0000-0000-0000-000000000001';

select is(
  (select is_published from public.directory_profiles where profile_id = '20000000-0000-0000-0000-000000000001'),
  true,
  'Una reaprobación administrativa restaura la proyección existente'
);

update public.professional_profiles
set status = 'changes_requested'
where id = '20000000-0000-0000-0000-000000000001';

select is(
  (select is_published from public.directory_profiles where profile_id = '20000000-0000-0000-0000-000000000001'),
  true,
  'Solicitar cambios conserva la última versión aprobada visible'
);

select * from finish();
rollback;
