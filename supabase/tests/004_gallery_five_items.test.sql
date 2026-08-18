begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

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

select * from finish();
rollback;
