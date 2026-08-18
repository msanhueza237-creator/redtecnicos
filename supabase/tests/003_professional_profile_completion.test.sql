begin;

create extension if not exists pgtap with schema extensions;
select plan(30);

select has_column('public', 'professional_profiles', 'avatar_path', 'El perfil editable admite fotografía privada');
select has_column('public', 'professional_profiles', 'accepts_new_requests', 'El profesional puede pausar solicitudes');
select has_column('public', 'professional_profiles', 'brands', 'El perfil editable guarda marcas');
select has_column('public', 'professional_profiles', 'identity_verified_at', 'La verificación de identidad queda fechada');
select has_column('public', 'directory_profiles', 'accepts_new_requests', 'La proyección pública refleja disponibilidad operativa');
select has_column('public', 'directory_profiles', 'brands', 'La proyección pública admite marcas aprobadas');
select has_column('public', 'reviews', 'professional_reply', 'Las evaluaciones admiten una respuesta profesional');
select has_table('public', 'identity_documents', 'Existe la tabla privada de identidad');
select ok((select relrowsecurity from pg_class where oid = 'public.identity_documents'::regclass), 'RLS está activo en identidad');
select table_privs_are('public', 'identity_documents', 'anon', array[]::text[], 'anon no accede a identidad');
select table_privs_are('public', 'identity_documents', 'authenticated', array['SELECT']::text[], 'authenticated solo puede leer identidad mediante RLS');

select has_function('public', 'update_owned_professional_profile', array['text','text','text','text[]','integer','text','text','text'], 'Existe la edición segura del perfil');
select function_privs_are('public', 'update_owned_professional_profile', array['text','text','text','text[]','integer','text','text','text'], 'anon', array[]::text[], 'anon no edita perfiles');
select function_privs_are('public', 'update_owned_professional_profile', array['text','text','text','text[]','integer','text','text','text'], 'authenticated', array['EXECUTE'], 'authenticated invoca edición con validación interna');
select has_function('public', 'update_owned_professional_services', array['text[]','text[]','text[]','text[]'], 'Existe la edición segura de servicios');
select function_privs_are('public', 'update_owned_professional_services', array['text[]','text[]','text[]','text[]'], 'authenticated', array['EXECUTE'], 'authenticated puede editar sus servicios mediante RPC');
select has_function('public', 'update_owned_professional_preferences', array['text','text','boolean','boolean','boolean','boolean','boolean','text','text[]'], 'Existe la edición segura de disponibilidad');
select function_privs_are('public', 'update_owned_professional_preferences', array['text','text','boolean','boolean','boolean','boolean','boolean','text','text[]'], 'authenticated', array['EXECUTE'], 'authenticated puede editar sus preferencias mediante RPC');
select has_function('public', 'set_owned_profile_avatar', array['text'], 'Existe la asociación segura de avatar');
select function_privs_are('public', 'set_owned_profile_avatar', array['text'], 'authenticated', array['EXECUTE'], 'authenticated asocia solo su avatar');
select has_function('public', 'reply_to_owned_review', array['uuid','text'], 'Existe la respuesta única a evaluaciones');
select function_privs_are('public', 'reply_to_owned_review', array['uuid','text'], 'authenticated', array['EXECUTE'], 'authenticated responde solo evaluaciones propias');
select has_function('public', 'list_owned_professional_reviews', array[]::text[], 'Existe la bandeja privada de evaluaciones');
select has_function('public', 'list_public_profile_reviews', array['uuid','integer'], 'Existe la proyección pública de evaluaciones');
select function_privs_are('public', 'list_public_profile_reviews', array['uuid','integer'], 'anon', array['EXECUTE'], 'anon solo consulta evaluaciones publicadas mediante RPC');
select has_function('public', 'moderate_identity_document', array['uuid','text','text'], 'Existe la moderación auditada de identidad');
select function_privs_are('public', 'moderate_identity_document', array['uuid','text','text'], 'anon', array[]::text[], 'anon no modera identidad');
select function_privs_are('public', 'moderate_identity_document', array['uuid','text','text'], 'authenticated', array['EXECUTE'], 'authenticated invoca una función que valida el rol administrativo');
select ok(exists(select 1 from storage.buckets where id = 'identity-documents' and not public), 'El bucket de identidad es privado');
select has_trigger('public', 'contact_requests', 'contact_request_public_profile_guard', 'Las solicitudes validan perfil publicado y disponibilidad');

select * from finish();
rollback;
