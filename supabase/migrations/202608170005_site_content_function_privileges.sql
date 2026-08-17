-- Endurece instalaciones donde los eventos de Supabase conceden EXECUTE a anon
-- al crear funciones en public, incluso después de revocar el rol PUBLIC.

begin;

revoke all on function public.list_admin_site_content() from anon;
revoke all on function public.save_site_content_draft(
  text, integer, boolean, text, text, text, text, text, text, text, text
) from anon;
revoke all on function public.publish_site_content(text, integer, text) from anon;

commit;
