-- Permite generar enlaces temporales solo para fotografías y avatares que
-- pertenecen a perfiles actualmente publicados. La función usa privilegios
-- internos para evitar que el RLS de las tablas privadas oculte la evidencia
-- que la propia política de Storage debe validar.

begin;

create or replace function private.is_public_profile_asset(
  object_bucket text,
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when object_bucket = 'gallery-images' then exists (
      select 1
      from public.portfolio_items item
      join public.directory_profiles directory
        on directory.profile_id = item.profile_id
      where item.storage_path = object_name
        and item.status = 'reviewed'
        and directory.is_published
        and not directory.is_demo
    )
    when object_bucket = 'profile-images' then exists (
      select 1
      from public.directory_profiles directory
      where directory.avatar_path = object_name
        and directory.is_published
        and not directory.is_demo
    )
    else false
  end;
$$;

revoke all on function private.is_public_profile_asset(text, text) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_public_profile_asset(text, text) to anon, authenticated;

drop policy if exists storage_approved_gallery_read on storage.objects;
create policy storage_approved_gallery_read on storage.objects
for select to anon, authenticated
using (private.is_public_profile_asset(bucket_id, name));

comment on function private.is_public_profile_asset(text, text) is
  'Autoriza únicamente activos revisados de perfiles públicos no demo para enlaces temporales.';

commit;
