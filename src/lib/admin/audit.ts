import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AdminAuditEvent {
  id: number;
  actorUserId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  reason: string;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
}

export interface AuditFilters {
  query?: string;
  action?: string;
  entityType?: string;
}

interface AuditRow {
  id: number;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  reason: string;
  before_data: unknown;
  after_data: unknown;
  created_at: string;
}

export async function listAdminAuditEvents(
  filters: AuditFilters = {},
  limit = 200,
): Promise<{ data: AdminAuditEvent[]; error: string | null }> {
  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select("id,actor_user_id,action,entity_type,entity_id,reason,before_data,after_data,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.query) {
    const safeQuery = filters.query.replace(/[^\p{L}\p{N}\s._-]/gu, "").slice(0, 80);
    if (safeQuery) query = query.or(`action.ilike.%${safeQuery}%,entity_type.ilike.%${safeQuery}%,entity_id.ilike.%${safeQuery}%,reason.ilike.%${safeQuery}%`);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: "No fue posible cargar la auditoría desde Supabase." };
  const rows = (data ?? []) as AuditRow[];
  const actorIds = [...new Set(rows.map((row) => row.actor_user_id).filter((id): id is string => Boolean(id)))];
  const actors = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: users } = await supabase.from("app_users").select("user_id,display_name").in("user_id", actorIds);
    for (const user of users ?? []) actors.set(user.user_id, user.display_name);
  }

  return {
    data: rows.map((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      actorName: row.actor_user_id ? actors.get(row.actor_user_id) ?? "Usuario administrativo" : "Sistema o visitante",
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      reason: row.reason,
      beforeData: row.before_data,
      afterData: row.after_data,
      createdAt: row.created_at,
    })),
    error: null,
  };
}
