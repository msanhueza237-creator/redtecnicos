begin;

create extension if not exists pgtap with schema extensions;
select plan(81);

select has_table('public', 'app_users', 'Existe la extensión segura de auth.users');
select has_table('public', 'professional_profiles', 'Existe el perfil editable privado');
select has_table('public', 'directory_profiles', 'Existe la proyección pública aprobada');
select has_column('public', 'directory_profiles', 'is_published', 'La proyección conserva un estado explícito de publicación');
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
select has_trigger(
  'public', 'professional_profiles', 'professional_profile_visibility_sync',
  'Los cambios de estado sincronizan la visibilidad pública'
);
select has_trigger(
  'public', 'contact_requests', 'contact_request_public_profile_guard',
  'Las solicitudes nuevas exigen un perfil actualmente publicado'
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

select has_function(
  'public',
  'moderate_portfolio_item',
  array['uuid', 'text', 'text'],
  'Existe la moderación auditada de fotografías'
);
select function_privs_are(
  'public',
  'moderate_portfolio_item',
  array['uuid', 'text', 'text'],
  'anon',
  array[]::text[],
  'anon no puede moderar fotografías'
);
select function_privs_are(
  'public',
  'moderate_portfolio_item',
  array['uuid', 'text', 'text'],
  'authenticated',
  array['EXECUTE'],
  'authenticated invoca la función, que valida el rol internamente'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'portfolio_items'
      and policyname = 'portfolio_owner_delete_pending'
      and cmd = 'DELETE'
  ),
  'El propietario puede retirar fotografías pendientes mediante RLS'
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

select has_function('public', 'list_public_reviews', array['integer'], 'Existe la consulta pública que omite datos privados del cliente');
select function_privs_are('public', 'list_public_reviews', array['integer'], 'anon', array['EXECUTE'], 'anon puede consultar únicamente evaluaciones publicadas y anonimizadas');
select function_privs_are('public', 'list_public_reviews', array['integer'], 'authenticated', array['EXECUTE'], 'authenticated puede consultar la misma proyección pública segura');

select ok(
  not has_table_privilege('anon', 'public.contact_requests', 'INSERT'),
  'la inserción directa permanece revocada'
);

select has_table('public', 'chile_communes', 'Existe el catálogo territorial oficial');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.chile_communes'::regclass),
  'RLS está activo en el catálogo de comunas'
);
select table_privs_are(
  'public', 'chile_communes', 'anon', array['SELECT'],
  'anon solo puede leer el catálogo territorial'
);
select is(
  (select count(*) from public.chile_communes),
  346::bigint,
  'el catálogo contiene las 346 comunas de Chile'
);
select is(
  (select count(*) from public.chile_communes where region_code = 'CL-RM'),
  52::bigint,
  'la Región Metropolitana contiene 52 comunas'
);
select has_function(
  'public',
  'update_owned_profile_coverage',
  array['text','text[]','text[]','boolean'],
  'Existe la actualización segura de cobertura profesional'
);
select function_privs_are(
  'public', 'update_owned_profile_coverage', array['text','text[]','text[]','boolean'],
  'anon', array[]::text[], 'anon no puede modificar coberturas'
);
select function_privs_are(
  'public', 'update_owned_profile_coverage', array['text','text[]','text[]','boolean'],
  'authenticated', array['EXECUTE'],
  'authenticated invoca la función, que valida propiedad y rol internamente'
);

select has_table('public', 'complaints', 'Existe la bandeja privada de reclamos');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.complaints'::regclass),
  'RLS está activo en reclamos'
);
select table_privs_are('public', 'complaints', 'anon', array[]::text[], 'anon no accede directamente a reclamos');
select has_function(
  'public', 'create_public_complaint',
  array['text','text','text','public.complaint_category','text','text','public.complaint_related_type','text','text','text'],
  'Existe la recepción pública segura de reclamos'
);
select function_privs_are(
  'public', 'create_public_complaint',
  array['text','text','text','public.complaint_category','text','text','public.complaint_related_type','text','text','text'],
  'anon', array['EXECUTE'], 'anon solo puede crear reclamos mediante la función validada'
);
select has_function(
  'public', 'update_complaint_case',
  array['uuid','public.complaint_status','public.complaint_priority','text','text'],
  'Existe la gestión auditada de casos'
);
select function_privs_are(
  'public', 'update_complaint_case',
  array['uuid','public.complaint_status','public.complaint_priority','text','text'],
  'anon', array[]::text[], 'anon no puede gestionar reclamos'
);
select function_privs_are(
  'public', 'update_complaint_case',
  array['uuid','public.complaint_status','public.complaint_priority','text','text'],
  'authenticated', array['EXECUTE'],
  'authenticated invoca la función, que valida el rol internamente'
);

select has_function(
  'public', 'get_admin_statistics', array['integer'],
  'Existe la consulta administrativa de estadísticas agregadas'
);
select function_privs_are(
  'public', 'get_admin_statistics', array['integer'],
  'anon', array[]::text[],
  'anon no puede consultar estadísticas administrativas'
);
select function_privs_are(
  'public', 'get_admin_statistics', array['integer'],
  'authenticated', array['EXECUTE'],
  'authenticated invoca la función, que valida admin o superadmin internamente'
);

select has_table('public', 'site_content_entries', 'Existe el contenido público versionado');
select has_table('public', 'site_content_versions', 'Existe el historial de versiones de contenido');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.site_content_entries'::regclass),
  'RLS está activo en el contenido administrable'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.site_content_versions'::regclass),
  'RLS está activo en el historial de contenido'
);
select has_function('public', 'get_public_site_content', array[]::text[], 'Existe la proyección pública segura del contenido');
select function_privs_are('public', 'get_public_site_content', array[]::text[], 'anon', array['EXECUTE'], 'anon puede leer solo versiones publicadas');
select function_privs_are('public', 'get_public_site_content', array[]::text[], 'authenticated', array['EXECUTE'], 'authenticated accede a la misma proyección pública');
select has_function('public', 'list_admin_site_content', array[]::text[], 'Existe la consulta administrativa de contenido');
select function_privs_are('public', 'list_admin_site_content', array[]::text[], 'anon', array[]::text[], 'anon no puede leer borradores');
select function_privs_are('public', 'list_admin_site_content', array[]::text[], 'authenticated', array['EXECUTE'], 'authenticated invoca la consulta que valida el rol');
select has_function(
  'public', 'save_site_content_draft',
  array['text','integer','boolean','text','text','text','text','text','text','text','text'],
  'Existe el guardado auditado de borradores'
);
select function_privs_are(
  'public', 'save_site_content_draft',
  array['text','integer','boolean','text','text','text','text','text','text','text','text'],
  'anon', array[]::text[], 'anon no puede guardar borradores'
);
select function_privs_are(
  'public', 'save_site_content_draft',
  array['text','integer','boolean','text','text','text','text','text','text','text','text'],
  'authenticated', array['EXECUTE'], 'authenticated invoca el guardado que valida admin'
);
select has_function('public', 'publish_site_content', array['text','integer','text'], 'Existe la publicación auditada de contenido');
select function_privs_are('public', 'publish_site_content', array['text','integer','text'], 'anon', array[]::text[], 'anon no puede publicar contenido');
select function_privs_are('public', 'publish_site_content', array['text','integer','text'], 'authenticated', array['EXECUTE'], 'authenticated invoca la publicación que valida admin');

select * from finish();
rollback;
