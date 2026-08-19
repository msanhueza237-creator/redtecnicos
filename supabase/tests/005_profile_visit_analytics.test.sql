begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'analytics-test@redtecnicos.invalid', '', now(),
  '{}'::jsonb, '{"display_name":"Perfil analítica"}'::jsonb, now(), now()
);

update public.professional_profiles
set id = '20000000-0000-0000-0000-000000000005',
    slug = 'perfil-analitica-test',
    display_name = 'Perfil analítica',
    headline = 'Técnico de prueba',
    summary = repeat('Descripción segura de prueba. ', 3),
    categories = array['residential'::public.professional_category],
    region_code = 'CL-RM',
    commune_codes = array['Santiago'],
    services = array['Instalación de aire acondicionado'],
    years_experience = 5,
    modalities = array['Atención a domicilio'],
    status = 'approved'
where owner_user_id = '10000000-0000-0000-0000-000000000005';

insert into public.directory_profiles (
  profile_id, owner_user_id, slug, kind, display_name, headline, summary,
  categories, region_code, commune_codes, services, specialties,
  years_experience, modalities, has_vehicle, is_published, is_demo
) values (
  '20000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000005',
  'perfil-analitica-test', 'technician', 'Perfil analítica',
  'Técnico de prueba', repeat('Descripción segura de prueba. ', 3),
  array['residential'::public.professional_category], 'CL-RM', array['Santiago'],
  array['Instalación de aire acondicionado'], '{}', 5, array['Domiciliaria'],
  false, true, false
);

insert into public.profile_daily_views(profile_id, viewed_on, view_count)
values ('20000000-0000-0000-0000-000000000005', current_date - interval '14 months', 9);

set local role service_role;
select lives_ok(
  $$select public.record_public_profile_view('perfil-analitica-test', repeat('a', 64))$$,
  'La aplicación puede registrar una apertura agregada'
);
reset role;

select is(
  (select view_count from public.profile_daily_views
   where profile_id = '20000000-0000-0000-0000-000000000005'
     and viewed_on = timezone('America/Santiago', now())::date),
  1::bigint,
  'La primera apertura crea el total diario'
);

set local role service_role;
select lives_ok(
  $$select public.record_public_profile_view('perfil-analitica-test', repeat('a', 64))$$,
  'Una nueva apertura incrementa el mismo total diario'
);
reset role;

select is(
  (select view_count from public.profile_daily_views
   where profile_id = '20000000-0000-0000-0000-000000000005'
     and viewed_on = timezone('America/Santiago', now())::date),
  2::bigint,
  'Las aperturas se acumulan sin crear eventos individuales'
);

select is(
  (select count(*) from public.profile_daily_views
   where profile_id = '20000000-0000-0000-0000-000000000005'
     and viewed_on < timezone('America/Santiago', now())::date - interval '13 months'),
  0::bigint,
  'El registro aplica la retención máxima de 13 meses'
);

update public.professional_profiles
set status = 'rejected'
where id = '20000000-0000-0000-0000-000000000005';

set local role service_role;
select throws_ok(
  $$select public.record_public_profile_view('perfil-analitica-test', repeat('b', 64))$$,
  'PROFILE_NOT_FOUND',
  'Un perfil retirado no puede seguir acumulando visitas'
);
reset role;

select * from finish();
rollback;
