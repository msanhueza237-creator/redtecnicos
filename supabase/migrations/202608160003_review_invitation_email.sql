begin;

-- El token de seguimiento funciona como credencial opaca de 256 bits. La
-- aplicación usa este contexto solo en el servidor y nunca devuelve el correo
-- del cliente en la respuesta HTTP de seguimiento.
create or replace function public.get_review_invitation_context(
  p_tracking_token_hash text
)
returns table (
  requester_name text,
  requester_email text,
  requester_email_verified boolean,
  requested_service text,
  professional_display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    request.requester_name,
    request.requester_email,
    request.requester_email_verified_at is not null,
    request.requested_service,
    directory.display_name
  from public.contact_requests request
  join public.directory_profiles directory
    on directory.profile_id = request.professional_profile_id
  where request.tracking_token_hash = p_tracking_token_hash
    and request.status = 'completed'
    and not request.is_demo
    and not directory.is_demo
  limit 1;
$$;

revoke all on function public.get_review_invitation_context(text) from public;
grant execute on function public.get_review_invitation_context(text) to anon, authenticated;

commit;
