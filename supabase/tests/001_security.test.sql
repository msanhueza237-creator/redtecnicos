begin;

create extension if not exists pgtap with schema extensions;
select plan(35);

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

select has_column('public', 'contact_requests', 'email_verification_token_hash', 'Las solicitudes permiten verificar el correo con un token separado');
select has_column('public', 'reviews', 'would_recommend', 'Las evaluaciones conservan la recomendación del cliente');

select has_function(
  'public',
  'create_public_contact_request',
  array['uuid','text','text','text','text','text','text','text','text','text','text','text'],
  'Existe la creación pública segura de solicitudes'
);
select function_privs_are(
  'public',
  'create_public_contact_request',
  array['uuid','text','text','text','text','text','text','text','text','text','text','text'],
  'anon', array['EXECUTE'],
  'anon solo puede crear solicitudes mediante la función validada'
);
select table_privs_are('public', 'contact_requests', 'anon', array[]::text[], 'anon no puede insertar directamente en solicitudes');

select has_function('public', 'get_public_contact_request_by_token', array['text'], 'Existe el seguimiento por token opaco');
select function_privs_are('public', 'get_public_contact_request_by_token', array['text'], 'anon', array['EXECUTE'], 'anon puede usar un token opaco para seguimiento');
select has_function('public', 'verify_contact_request_email', array['text','text'], 'Existe la verificación separada de correo');
select has_function('public', 'complete_public_contact_request', array['text'], 'Existe la confirmación de trabajo por token');
select has_function('public', 'get_review_invitation_context', array['text'], 'Existe el contexto privado para invitar a evaluar');
select function_privs_are('public', 'get_review_invitation_context', array['text'], 'anon', array['EXECUTE'], 'anon requiere el token opaco para obtener el contexto');
select has_function('public', 'create_public_review', array['text','integer','text','boolean'], 'Existe la evaluación ligada a una solicitud');
select has_function('public', 'update_owned_contact_request_status', array['uuid','public.contact_request_state'], 'Existe la actualización de estado del propietario');
select function_privs_are('public', 'update_owned_contact_request_status', array['uuid','public.contact_request_state'], 'anon', array[]::text[], 'anon no puede actualizar el historial profesional');
select function_privs_are('public', 'update_owned_contact_request_status', array['uuid','public.contact_request_state'], 'authenticated', array['EXECUTE'], 'el profesional autenticado invoca la transición validada');

select has_function('public', 'moderate_review', array['uuid','text','text'], 'Existe la moderación auditada de evaluaciones');
select function_privs_are('public', 'moderate_review', array['uuid','text','text'], 'anon', array[]::text[], 'anon no puede moderar evaluaciones');
select function_privs_are('public', 'moderate_review', array['uuid','text','text'], 'authenticated', array['EXECUTE'], 'authenticated invoca la función, que valida el rol internamente');

select ok(
  not has_table_privilege('anon', 'public.contact_requests', 'INSERT'),
  'la inserción directa permanece revocada'
);

select * from finish();
rollback;
