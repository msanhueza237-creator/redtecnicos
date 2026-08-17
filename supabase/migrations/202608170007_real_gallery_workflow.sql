-- Galería real: retiro por propietario y moderación auditada con proyección pública.

begin;

drop policy if exists portfolio_owner_delete_pending on public.portfolio_items;
create policy portfolio_owner_delete_pending on public.portfolio_items
for delete to authenticated
using (
  status in ('pending_review', 'changes_requested')
  and exists (
    select 1
    from public.professional_profiles profile
    where profile.id = portfolio_items.profile_id
      and profile.owner_user_id = (select auth.uid())
  )
);

grant delete on public.portfolio_items to authenticated;

create or replace function public.moderate_portfolio_item(
  target_item_id uuid,
  decision_key text,
  decision_reason text
)
returns public.moderation_state
language plpgsql
security definer
set search_path = ''
as $$
declare
  item_record public.portfolio_items%rowtype;
  next_status public.moderation_state;
  reviewed_portfolio jsonb;
begin
  if not (select private.is_staff()) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(decision_reason, ''))) < 8 then
    raise exception 'Se requiere un motivo de al menos 8 caracteres.';
  end if;
  if decision_key not in ('approve', 'request_changes', 'hide') then
    raise exception 'Decisión no válida.';
  end if;

  select * into item_record
  from public.portfolio_items
  where id = target_item_id
  for update;
  if not found then raise exception 'Fotografía no encontrada.'; end if;

  if decision_key = 'approve' and item_record.status not in ('pending_review', 'changes_requested') then
    raise exception 'El estado actual no permite aprobar esta fotografía.';
  end if;
  if decision_key = 'request_changes' and item_record.status not in ('pending_review', 'reviewed') then
    raise exception 'El estado actual no permite solicitar cambios.';
  end if;
  if decision_key = 'hide' and item_record.status = 'hidden' then
    raise exception 'La fotografía ya está oculta.';
  end if;

  next_status := case decision_key
    when 'approve' then 'reviewed'::public.moderation_state
    when 'request_changes' then 'changes_requested'::public.moderation_state
    else 'hidden'::public.moderation_state
  end;

  update public.portfolio_items
  set status = next_status,
      review_reason = trim(decision_reason),
      reviewed_at = now(),
      reviewed_by = (select auth.uid())
  where id = target_item_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', reviewed.id,
        'title', reviewed.title,
        'category', reviewed.category,
        'description', reviewed.description,
        'storagePath', reviewed.storage_path,
        'altText', reviewed.alt_text,
        'displayOrder', reviewed.display_order
      ) order by reviewed.display_order
    ),
    '[]'::jsonb
  )
  into reviewed_portfolio
  from (
    select id, title, category, description, storage_path, alt_text, display_order
    from public.portfolio_items
    where profile_id = item_record.profile_id
      and status = 'reviewed'
    order by display_order
    limit 3
  ) reviewed;

  update public.directory_profiles
  set portfolio = reviewed_portfolio,
      updated_at = now()
  where profile_id = item_record.profile_id;

  insert into public.audit_log (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    reason,
    before_data,
    after_data
  ) values (
    (select auth.uid()),
    'portfolio.' || decision_key,
    'portfolio_item',
    target_item_id::text,
    trim(decision_reason),
    jsonb_build_object('status', item_record.status, 'profile_id', item_record.profile_id),
    jsonb_build_object('status', next_status, 'profile_id', item_record.profile_id)
  );

  return next_status;
end;
$$;

revoke all on function public.moderate_portfolio_item(uuid, text, text) from public, anon;
grant execute on function public.moderate_portfolio_item(uuid, text, text) to authenticated;

comment on function public.moderate_portfolio_item(uuid, text, text) is
  'Modera una fotografía, actualiza la proyección pública y registra la decisión en auditoría.';

commit;
