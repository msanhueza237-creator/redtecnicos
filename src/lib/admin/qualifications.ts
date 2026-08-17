import "server-only";

import type { AdminStatusTone } from "@/data/admin-demo";
import {
  qualificationStatusLabel,
  type ProfessionalQualificationType,
  type QualificationModerationState,
} from "@/domain/professional-qualification";
import { createClient } from "@/lib/supabase/server";

export interface AdminQualificationDocument {
  id: string;
  profileId: string;
  owner: string;
  type: ProfessionalQualificationType;
  title: string;
  institution: string;
  issuedYear: number;
  expiresAt: string | null;
  status: QualificationModerationState;
  reviewReason: string | null;
  createdAt: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  scanStatus: "clean" | "legacy_unverified";
  hasDocument: boolean;
}

interface QualificationRow {
  id: string;
  profile_id: string;
  qualification_type: ProfessionalQualificationType;
  title: string;
  institution: string;
  issued_year: number;
  expires_at: string | null;
  document_path: string | null;
  status: QualificationModerationState;
  review_reason: string | null;
  created_at: string;
  original_file_name: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  scan_status: "clean" | "legacy_unverified" | null;
}

export async function listAdminQualificationDocuments(limit = 100): Promise<{ data: AdminQualificationDocument[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qualifications")
    .select("id,profile_id,qualification_type,title,institution,issued_year,expires_at,document_path,status,review_reason,created_at,original_file_name,file_size_bytes,mime_type,scan_status")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: "No fue posible cargar la bandeja documental." };
  const rows = (data ?? []) as unknown as QualificationRow[];
  if (!rows.length) return { data: [], error: null };

  const profileIds = [...new Set(rows.map((row) => row.profile_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from("professional_profiles")
    .select("id,display_name")
    .in("id", profileIds);
  if (profilesError) return { data: [], error: "No fue posible identificar a los propietarios de los documentos." };

  const owners = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  return {
    data: rows.map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      owner: owners.get(row.profile_id) ?? "Profesional no disponible",
      type: row.qualification_type,
      title: row.title,
      institution: row.institution,
      issuedYear: row.issued_year,
      expiresAt: row.expires_at,
      status: row.status,
      reviewReason: row.review_reason,
      createdAt: row.created_at,
      originalFileName: row.original_file_name ?? "Documento no identificado",
      fileSizeBytes: Number(row.file_size_bytes ?? 0),
      mimeType: row.mime_type ?? "application/octet-stream",
      scanStatus: row.scan_status === "clean" ? "clean" : "legacy_unverified",
      hasDocument: Boolean(row.document_path),
    })),
    error: null,
  };
}

export function adminQualificationStatusTone(status: QualificationModerationState): AdminStatusTone {
  if (status === "reviewed") return "success";
  if (status === "pending_review") return "info";
  if (status === "changes_requested") return "warning";
  if (["rejected", "hidden"].includes(status)) return "danger";
  return "neutral";
}

export { qualificationStatusLabel as adminQualificationStatusLabel };
