import "server-only";

import type { AdminStatusTone } from "@/data/admin-demo";
import type { IdentityDocumentType } from "@/domain/identity-document";
import type { QualificationModerationState } from "@/domain/professional-qualification";
import { createClient } from "@/lib/supabase/server";

export interface AdminIdentityDocument {
  id: string;
  profileId: string;
  owner: string;
  documentType: IdentityDocumentType;
  subjectName: string;
  status: QualificationModerationState;
  reviewReason: string | null;
  originalFileName: string;
  fileSizeBytes: number;
  scanStatus: "clean";
  hasDocument: boolean;
  createdAt: string;
}

interface IdentityRow {
  id: string; profile_id: string; document_type: IdentityDocumentType; subject_name: string;
  status: QualificationModerationState; review_reason: string | null; original_file_name: string;
  file_size_bytes: number; scan_status: "clean"; document_path: string; created_at: string;
}

export async function listAdminIdentityDocuments(limit = 100): Promise<{ data: AdminIdentityDocument[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("identity_documents").select("id,profile_id,document_type,subject_name,status,review_reason,original_file_name,file_size_bytes,scan_status,document_path,created_at").order("created_at", { ascending: false }).limit(limit);
  if (error) return { data: [], error: "No fue posible cargar los documentos de identidad." };
  const rows = (data ?? []) as unknown as IdentityRow[];
  if (!rows.length) return { data: [], error: null };
  const { data: profiles, error: profilesError } = await supabase.from("professional_profiles").select("id,display_name").in("id", [...new Set(rows.map((row) => row.profile_id))]);
  if (profilesError) return { data: [], error: "No fue posible identificar a los propietarios." };
  const owners = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  return { data: rows.map((row) => ({ id: row.id, profileId: row.profile_id, owner: owners.get(row.profile_id) ?? "Profesional no disponible", documentType: row.document_type, subjectName: row.subject_name, status: row.status, reviewReason: row.review_reason, originalFileName: row.original_file_name, fileSizeBytes: Number(row.file_size_bytes), scanStatus: "clean", hasDocument: Boolean(row.document_path), createdAt: row.created_at })), error: null };
}

export function adminIdentityStatusTone(status: QualificationModerationState): AdminStatusTone {
  if (status === "reviewed") return "success";
  if (status === "pending_review") return "info";
  if (status === "changes_requested") return "warning";
  if (["rejected", "hidden"].includes(status)) return "danger";
  return "neutral";
}
