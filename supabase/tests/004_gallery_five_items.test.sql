begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

select ok(
  exists(
    select 1
    from pg_constraint
    where conrelid = 'public.portfolio_items'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%display_order%'
      and pg_get_constraintdef(oid) ilike '%<= 5%'
  ),
  'La galería privada admite posiciones de uno a cinco'
);

select ok(
  exists(
    select 1
    from pg_constraint
    where conrelid = 'public.directory_profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%jsonb_array_length(portfolio)%'
      and pg_get_constraintdef(oid) ilike '%<= 5%'
  ),
  'La proyección pública admite hasta cinco imágenes aprobadas'
);

select ok(
  lower(pg_get_functiondef('public.moderate_portfolio_item(uuid,text,text)'::regprocedure)) like '%limit 5%',
  'La moderación proyecta como máximo cinco trabajos revisados'
);

select has_function(
  'private',
  'is_public_profile_asset',
  array['text', 'text'],
  'Existe la autorización segura de imágenes públicas'
);

select function_privs_are(
  'private',
  'is_public_profile_asset',
  array['text', 'text'],
  'anon',
  array['EXECUTE'],
  'anon solo puede consultar si un activo está aprobado'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_approved_gallery_read'
      and qual ilike '%is_public_profile_asset%'
  ),
  'Storage valida la publicación mediante la función segura'
);

select * from finish();
rollback;
