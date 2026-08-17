import "server-only";

import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintRelatedType,
  ComplaintStatus,
} from "@/domain/complaint";
import type { AdminStatusTone } from "@/data/admin-demo";
import { createClient } from "@/lib/supabase/server";

export interface AdminComplaint {
  id: string;
  caseNumber: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string | null;
  category: ComplaintCategory;
  subject: string;
  description: string;
  relatedType: ComplaintRelatedType;
  relatedReference: string | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedTo: string | null;
  assignedToName: string | null;
  lastAdminReason: string | null;
  resolutionSummary: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ComplaintRow {
  id: string;
  case_number: string;
  reporter_name: string;
  reporter_email: string;
  reporter_phone: string | null;
  category: ComplaintCategory;
  subject: string;
  description: string;
  related_type: ComplaintRelatedType;
  related_reference: string | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assigned_to: string | null;
  last_admin_reason: string | null;
  resolution_summary: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const complaintFields = "id,case_number,reporter_name,reporter_email,reporter_phone,category,subject,description,related_type,related_reference,status,priority,assigned_to,last_admin_reason,resolution_summary,resolved_at,created_at,updated_at";

async function mapComplaints(rows: ComplaintRow[]): Promise<AdminComplaint[]> {
  const assigneeIds = [...new Set(rows.map((row) => row.assigned_to).filter((id): id is string => Boolean(id)))];
  const assignees = new Map<string, string>();
  if (assigneeIds.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase.from("app_users").select("user_id,display_name").in("user_id", assigneeIds);
    for (const user of data ?? []) assignees.set(user.user_id, user.display_name);
  }

  return rows.map((row) => ({
    id: row.id,
    caseNumber: row.case_number,
    reporterName: row.reporter_name,
    reporterEmail: row.reporter_email,
    reporterPhone: row.reporter_phone,
    category: row.category,
    subject: row.subject,
    description: row.description,
    relatedType: row.related_type,
    relatedReference: row.related_reference,
    status: row.status,
    priority: row.priority,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to ? assignees.get(row.assigned_to) ?? "Usuario administrativo" : null,
    lastAdminReason: row.last_admin_reason,
    resolutionSummary: row.resolution_summary,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function listAdminComplaints(limit = 200): Promise<{ data: AdminComplaint[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select(complaintFields)
    .eq("is_demo", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: "No fue posible cargar los reclamos desde Supabase." };
  return { data: await mapComplaints((data ?? []) as ComplaintRow[]), error: null };
}

export async function getAdminComplaint(id: string): Promise<{ data: AdminComplaint | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select(complaintFields)
    .eq("id", id)
    .eq("is_demo", false)
    .maybeSingle();
  if (error) return { data: null, error: "No fue posible cargar el reclamo desde Supabase." };
  if (!data) return { data: null, error: null };
  return { data: (await mapComplaints([data as ComplaintRow]))[0] ?? null, error: null };
}

export function complaintStatusTone(status: ComplaintStatus): AdminStatusTone {
  if (status === "resolved") return "success";
  if (["new", "triaged"].includes(status)) return "info";
  if (["investigating", "awaiting_information"].includes(status)) return "warning";
  return "neutral";
}

export function complaintPriorityTone(priority: ComplaintPriority): AdminStatusTone {
  if (["urgent", "high"].includes(priority)) return "danger";
  if (priority === "medium") return "warning";
  return "neutral";
}
