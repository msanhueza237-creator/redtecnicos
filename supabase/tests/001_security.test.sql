begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

select has_table('public', 'app_users', 'Existe la extensión segura de auth.users');
select has_table('public', 'professional_profiles', 'Existe el perfil editable privado');
select has_table('public', 'directory_profiles', 'Existe la proyección pública aprobada');
select has_table('public', 'contact_requests', 'Existe el historial de solicitudes');
select has_table('public', 'reviews', 'Existen evaluaciones ligadas a solicitudes');
select has_table('public', 'audit_log', 'Existe auditoría administrativa');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.app_users'::regclass),
  'RLS está activo en app_users'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.professional_profiles'::regclass),
  'RLS está activo en professional_profiles'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.directory_profiles'::regclass),
  'RLS está activo en directory_profiles'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.contact_requests'::regclass),
  'RLS está activo en contact_requests'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.reviews'::regclass),
  'RLS está activo en reviews'
);

select has_function(
  'private',
  'assign_role_by_email',
  array['text', 'public.app_role', 'text'],
  'Existe la promoción administrativa auditada'
);
select function_privs_are(
  'private',
  'assign_role_by_email',
  array['text', 'public.app_role', 'text'],
  'anon',
  array[]::text[],
  'anon no puede asignar roles'
);
select function_privs_are(
  'private',
  'assign_role_by_email',
  array['text', 'public.app_role', 'text'],
  'authenticated',
  array[]::text[],
  'un usuario autenticado no puede asignar roles'
);

select has_function(
  'public',
  'moderate_professional_profile',
  array['uuid', 'text', 'text'],
  'Existe la moderación profesional auditada'
);
select function_privs_are(
  'public',
  'moderate_professional_profile',
  array['uuid', 'text', 'text'],
  'anon',
  array[]::text[],
  'anon no puede moderar perfiles'
);
select function_privs_are(
  'public',
  'moderate_professional_profile',
  array['uuid', 'text', 'text'],
  'authenticated',
  array['EXECUTE'],
  'authenticated puede invocar la función, que valida el rol internamente'
);

select * from finish();
rollback;
