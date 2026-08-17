import "server-only";

import type {
  ProfessionalQualificationItem,
  ProfessionalQualificationType,
  QualificationModerationState,
} from "@/domain/professional-qualification";
import { createClient } from "@/lib/supabase/server";

interface QualificationRow {
  id: string;
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
  scan_status: "clean" | "legacy_unverified" | null;
}

export interface ProfessionalQualificationsResult {
  data: ProfessionalQualificationItem[];
  error: string | null;
}

export async function listProfessionalQualifications(userId: string): Promise<ProfessionalQualificationsResult> {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return { data: [], error: "No fue posible identificar tu perfil profesional." };
  }

  const { data, error } = await supabase
    .from("qualifications")
    .select("id,qualification_type,title,institution,issued_year,expires_at,document_path,status,review_reason,created_at,original_file_name,file_size_bytes,scan_status")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: "No fue posible cargar tu formación y documentos." };

  return {
    data: ((data ?? []) as unknown as QualificationRow[]).map((row) => ({
      id: row.id,
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
      hasDocument: Boolean(row.document_path),
      scanStatus: row.scan_status === "clean" ? "clean" : "legacy_unverified",
    })),
    error: null,
  };
}
