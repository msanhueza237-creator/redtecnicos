begin;

create or replace function public.moderate_review(
  target_review_id uuid,
  decision_key text,
  decision_reason text
)
returns public.review_state
language plpgsql
security definer
set search_path = ''
as $$
declare
  review_record public.reviews%rowtype;
  request_record public.contact_requests%rowtype;
  next_status public.review_state;
begin
  if not (select private.is_staff()) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(decision_reason, ''))) < 8 then
    raise exception 'Se requiere un motivo de al menos 8 caracteres.';
  end if;

  if decision_key not in ('publish', 'reject', 'hide') then
    raise exception 'Decisión no válida.';
  end if;

  select * into review_record
  from public.reviews
  where id = target_review_id
  for update;

  if not found then
    raise exception 'Evaluación no encontrada.';
  end if;

  select * into request_record
  from public.contact_requests
  where id = review_record.contact_request_id;

  if not found then
    raise exception 'Solicitud asociada no encontrada.';
  end if;

  if decision_key = 'publish' then
    if request_record.status <> 'completed'
      or request_record.requester_email_verified_at is null
      or request_record.is_demo then
      raise exception 'La solicitud no cumple las condiciones para publicar su evaluación.';
    end if;

    if review_record.status not in ('pending', 'rejected', 'hidden') then
      raise exception 'El estado actual no permite publicar esta evaluación.';
    end if;

    next_status := 'published'::public.review_state;
  elsif decision_key = 'reject' then
    if review_record.status not in ('pending', 'hidden') then
      raise exception 'El estado actual no permite rechazar esta evaluación.';
    end if;

    next_status := 'rejected'::public.review_state;
  else
    if review_record.status <> 'published' then
      raise exception 'Solo se puede ocultar una evaluación publicada.';
    end if;

    next_status := 'hidden'::public.review_state;
  end if;

  update public.reviews
  set status = next_status,
      moderated_at = now(),
      moderated_by = (select auth.uid()),
      moderation_reason = trim(decision_reason)
  where id = target_review_id;

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
    'review.' || decision_key,
    'review',
    target_review_id::text,
    trim(decision_reason),
    jsonb_build_object('status', review_record.status),
    jsonb_build_object('status', next_status)
  );

  return next_status;
end;
$$;

revoke all on function public.moderate_review(uuid, text, text) from public, anon;
grant execute on function public.moderate_review(uuid, text, text) to authenticated;

commit;
