import "server-only";

import type { IdentityDocumentItem, IdentityDocumentType } from "@/domain/identity-document";
import type { QualificationModerationState } from "@/domain/professional-qualification";
import { createClient } from "@/lib/supabase/server";

interface IdentityDocumentRow {
  id: string;
  document_type: IdentityDocumentType;
  subject_name: string;
  status: QualificationModerationState;
  review_reason: string | null;
  original_file_name: string;
  file_size_bytes: number;
  document_path: string;
  scan_status: "clean";
  created_at: string;
}

export async function listOwnedIdentityDocuments(userId: string): Promise<{ data: IdentityDocumentItem[]; error: string | null }> {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase.from("professional_profiles").select("id").eq("owner_user_id", userId).maybeSingle();
  if (profileError || !profile) return { data: [], error: "No fue posible identificar tu perfil profesional." };

  const { data, error } = await supabase
    .from("identity_documents")
    .select("id,document_type,subject_name,status,review_reason,original_file_name,file_size_bytes,document_path,scan_status,created_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });
  if (error) return { data: [], error: "No fue posible cargar tus documentos de identidad." };

  return {
    data: ((data ?? []) as unknown as IdentityDocumentRow[]).map((row) => ({
      id: row.id,
      documentType: row.document_type,
      subjectName: row.subject_name,
      status: row.status,
      reviewReason: row.review_reason,
      originalFileName: row.original_file_name,
      fileSizeBytes: Number(row.file_size_bytes),
      hasDocument: Boolean(row.document_path),
      scanStatus: "clean",
      createdAt: row.created_at,
    })),
    error: null,
  };
}
