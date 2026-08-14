-- Uso seguro (psql):
-- psql "$SUPABASE_DB_URL" -v admin_email='correo@dominio.cl' \
--   -v reason='Alta inicial autorizada' -f supabase/roles/bootstrap-admin.sql
-- La contraseña se crea o restablece exclusivamente mediante Supabase Auth.

\set ON_ERROR_STOP on

select private.assign_role_by_email(
  :'admin_email',
  'superadmin'::public.app_role,
  :'reason'
) as promoted_user_id;
