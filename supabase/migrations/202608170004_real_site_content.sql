-- Contenido público administrable con borradores, publicación explícita y auditoría.

begin;

create table public.site_content_entries (
  slot text primary key check (slot in ('home_directory_notice', 'home_professional_cta')),
  label text not null check (char_length(label) between 3 and 100),
  description text not null check (char_length(description) between 10 and 300),
  draft_content jsonb not null,
  published_content jsonb not null,
  revision integer not null default 1 check (revision > 0),
  published_revision integer not null default 1 check (published_revision > 0 and published_revision <= revision),
  published_version integer not null default 1 check (published_version > 0),
  updated_by uuid references public.app_users(user_id) on delete set null,
  published_by uuid references public.app_users(user_id) on delete set null,
  updated_at timestamptz not null default now(),
  published_at timestamptz not null default now()
);

create table public.site_content_versions (
  id bigint generated always as identity primary key,
  slot text not null references public.site_content_entries(slot) on delete restrict,
  revision integer not null check (revision > 0),
  published_version integer not null check (published_version > 0),
  event_type text not null check (event_type in ('initial_published', 'draft_saved', 'published')),
  content jsonb not null,
  actor_user_id uuid references public.app_users(user_id) on delete set null,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now()
);

create index site_content_versions_slot_created_idx
  on public.site_content_versions(slot, created_at desc);

create trigger site_content_entries_set_updated_at
before update on public.site_content_entries
for each row execute function private.set_updated_at();

create or replace function private.validate_site_content(p_content jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  allowed_hrefs constant text[] := array[
    '/tecnicos',
    '/registro-tecnico',
    '/registro-empresa',
    '/como-funciona',
    '/preguntas-frecuentes',
    '/reportar'
  ];
  secondary_label text := trim(coalesce(p_content ->> 'secondaryCtaLabel', ''));
  secondary_href text := trim(coalesce(p_content ->> 'secondaryCtaHref', ''));
begin
  if jsonb_typeof(p_content) <> 'object'
    or not (p_content ?& array[
      'enabled', 'eyebrow', 'title', 'body',
      'primaryCtaLabel', 'primaryCtaHref',
      'secondaryCtaLabel', 'secondaryCtaHref'
    ])
    or jsonb_typeof(p_content -> 'enabled') <> 'boolean'
  then
    raise exception 'El contenido tiene un formato inválido.';
  end if;

  if char_length(trim(coalesce(p_content ->> 'eyebrow', ''))) not between 3 and 60
    or char_length(trim(coalesce(p_content ->> 'title', ''))) not between 8 and 120
    or char_length(trim(coalesce(p_content ->> 'body', ''))) not between 20 and 500
    or char_length(trim(coalesce(p_content ->> 'primaryCtaLabel', ''))) not between 3 and 60
  then
    raise exception 'El contenido no cumple los límites permitidos.';
  end if;

  if not ((p_content ->> 'primaryCtaHref') = any(allowed_hrefs)) then
    raise exception 'El destino principal no está permitido.';
  end if;

  if (secondary_label = '') <> (secondary_href = '') then
    raise exception 'El botón secundario está incompleto.';
  end if;
  if char_length(secondary_label) > 60
    or (secondary_href <> '' and not (secondary_href = any(allowed_hrefs)))
  then
    raise exception 'El botón secundario no es válido.';
  end if;
end;
$$;

insert into public.site_content_entries (
  slot, label, description, draft_content, published_content
)
values
  (
    'home_directory_notice',
    'Aviso del directorio',
    'Bloque informativo para clientes, ubicado después del buscador principal.',
    '{"enabled":true,"eyebrow":"Directorio informativo","title":"Decide con información antes de contratar","body":"Compara cobertura, experiencia, formación revisada y evaluaciones verificadas. El presupuesto, pago, ejecución y garantía se acuerdan directamente con cada profesional.","primaryCtaLabel":"Explorar el directorio","primaryCtaHref":"/tecnicos","secondaryCtaLabel":"Cómo funciona","secondaryCtaHref":"/como-funciona"}'::jsonb,
    '{"enabled":true,"eyebrow":"Directorio informativo","title":"Decide con información antes de contratar","body":"Compara cobertura, experiencia, formación revisada y evaluaciones verificadas. El presupuesto, pago, ejecución y garantía se acuerdan directamente con cada profesional.","primaryCtaLabel":"Explorar el directorio","primaryCtaHref":"/tecnicos","secondaryCtaLabel":"Cómo funciona","secondaryCtaHref":"/como-funciona"}'::jsonb
  ),
  (
    'home_professional_cta',
    'Llamado para profesionales',
    'Bloque final de incorporación para técnicos y empresas.',
    '{"enabled":true,"eyebrow":"Para técnicos y empresas","title":"Haz visible tu experiencia en refrigeración y climatización","body":"Publica servicios, cobertura, formación revisada y trabajos realizados. Tú mantienes el control de tu información.","primaryCtaLabel":"Registrarme como técnico","primaryCtaHref":"/registro-tecnico","secondaryCtaLabel":"Registrar una empresa","secondaryCtaHref":"/registro-empresa"}'::jsonb,
    '{"enabled":true,"eyebrow":"Para técnicos y empresas","title":"Haz visible tu experiencia en refrigeración y climatización","body":"Publica servicios, cobertura, formación revisada y trabajos realizados. Tú mantienes el control de tu información.","primaryCtaLabel":"Registrarme como técnico","primaryCtaHref":"/registro-tecnico","secondaryCtaLabel":"Registrar una empresa","secondaryCtaHref":"/registro-empresa"}'::jsonb
  );

select private.validate_site_content(draft_content) from public.site_content_entries;
select private.validate_site_content(published_content) from public.site_content_entries;

insert into public.site_content_versions (
  slot, revision, published_version, event_type, content, reason
)
select slot, revision, published_version, 'initial_published', published_content, 'Versión inicial creada por migración.'
from public.site_content_entries;

alter table public.site_content_entries enable row level security;
alter table public.site_content_versions enable row level security;

revoke all on table public.site_content_entries from anon, authenticated;
revoke all on table public.site_content_versions from anon, authenticated;
revoke all on sequence public.site_content_versions_id_seq from anon, authenticated;

create or replace function public.get_public_site_content()
returns table (
  slot text,
  content jsonb,
  version integer,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select entry.slot, entry.published_content, entry.published_version, entry.published_at
  from public.site_content_entries entry
  order by entry.slot;
$$;

create or replace function public.list_admin_site_content()
returns table (
  slot text,
  label text,
  description text,
  draft_content jsonb,
  published_content jsonb,
  revision integer,
  published_revision integer,
  published_version integer,
  updated_at timestamptz,
  published_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  return query
  select
    entry.slot,
    entry.label,
    entry.description,
    entry.draft_content,
    entry.published_content,
    entry.revision,
    entry.published_revision,
    entry.published_version,
    entry.updated_at,
    entry.published_at
  from public.site_content_entries entry
  order by entry.slot;
end;
$$;

create or replace function public.save_site_content_draft(
  p_slot text,
  p_expected_revision integer,
  p_enabled boolean,
  p_eyebrow text,
  p_title text,
  p_body text,
  p_primary_cta_label text,
  p_primary_cta_href text,
  p_secondary_cta_label text,
  p_secondary_cta_href text,
  p_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_entry public.site_content_entries%rowtype;
  next_content jsonb;
  next_revision integer;
begin
  if not (select private.is_admin()) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) not between 8 and 500 then
    raise exception 'Se requiere un motivo de auditoría válido.';
  end if;

  select * into current_entry
  from public.site_content_entries
  where slot = p_slot
  for update;
  if not found then raise exception 'Bloque de contenido no encontrado.'; end if;
  if current_entry.revision <> p_expected_revision then
    raise exception 'La revisión del contenido cambió.' using errcode = '40001';
  end if;

  next_content := jsonb_build_object(
    'enabled', p_enabled,
    'eyebrow', trim(p_eyebrow),
    'title', trim(p_title),
    'body', trim(p_body),
    'primaryCtaLabel', trim(p_primary_cta_label),
    'primaryCtaHref', p_primary_cta_href,
    'secondaryCtaLabel', trim(coalesce(p_secondary_cta_label, '')),
    'secondaryCtaHref', trim(coalesce(p_secondary_cta_href, ''))
  );
  perform private.validate_site_content(next_content);
  next_revision := current_entry.revision + 1;

  update public.site_content_entries
  set draft_content = next_content,
      revision = next_revision,
      updated_by = (select auth.uid())
  where slot = p_slot;

  insert into public.site_content_versions (
    slot, revision, published_version, event_type, content, actor_user_id, reason
  ) values (
    p_slot, next_revision, current_entry.published_version, 'draft_saved',
    next_content, (select auth.uid()), trim(p_reason)
  );

  insert into public.audit_log (
    actor_user_id, action, entity_type, entity_id, reason, before_data, after_data
  ) values (
    (select auth.uid()), 'site_content.draft_saved', 'site_content', p_slot,
    trim(p_reason), current_entry.draft_content, next_content
  );

  return next_revision;
end;
$$;

create or replace function public.publish_site_content(
  p_slot text,
  p_expected_revision integer,
  p_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_entry public.site_content_entries%rowtype;
  next_version integer;
begin
  if not (select private.is_admin()) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) not between 8 and 500 then
    raise exception 'Se requiere un motivo de auditoría válido.';
  end if;

  select * into current_entry
  from public.site_content_entries
  where slot = p_slot
  for update;
  if not found then raise exception 'Bloque de contenido no encontrado.'; end if;
  if current_entry.revision <> p_expected_revision then
    raise exception 'La revisión del contenido cambió.' using errcode = '40001';
  end if;
  if current_entry.published_revision = current_entry.revision then
    raise exception 'No hay cambios pendientes de publicación.';
  end if;

  perform private.validate_site_content(current_entry.draft_content);
  next_version := current_entry.published_version + 1;

  update public.site_content_entries
  set published_content = current_entry.draft_content,
      published_revision = current_entry.revision,
      published_version = next_version,
      published_by = (select auth.uid()),
      published_at = now()
  where slot = p_slot;

  insert into public.site_content_versions (
    slot, revision, published_version, event_type, content, actor_user_id, reason
  ) values (
    p_slot, current_entry.revision, next_version, 'published',
    current_entry.draft_content, (select auth.uid()), trim(p_reason)
  );

  insert into public.audit_log (
    actor_user_id, action, entity_type, entity_id, reason, before_data, after_data
  ) values (
    (select auth.uid()), 'site_content.published', 'site_content', p_slot,
    trim(p_reason), current_entry.published_content, current_entry.draft_content
  );

  return next_version;
end;
$$;

revoke all on function private.validate_site_content(jsonb) from public, anon, authenticated;
revoke all on function public.get_public_site_content() from public;
revoke all on function public.list_admin_site_content() from public;
revoke all on function public.save_site_content_draft(text, integer, boolean, text, text, text, text, text, text, text, text) from public;
revoke all on function public.publish_site_content(text, integer, text) from public;

grant execute on function public.get_public_site_content() to anon, authenticated;
grant execute on function public.list_admin_site_content() to authenticated;
grant execute on function public.save_site_content_draft(text, integer, boolean, text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.publish_site_content(text, integer, text) to authenticated;

comment on function public.get_public_site_content() is
  'Entrega exclusivamente versiones publicadas de los bloques de contenido, sin metadatos administrativos.';
comment on function public.list_admin_site_content() is
  'Entrega borradores y versiones publicadas solo a administradores y superadministradores.';
comment on function public.save_site_content_draft(text, integer, boolean, text, text, text, text, text, text, text, text) is
  'Guarda un borrador validado con control de concurrencia y auditoría.';
comment on function public.publish_site_content(text, integer, text) is
  'Publica el borrador actual conservando versión, actor y motivo.';

commit;
