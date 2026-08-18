import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import sharp from "sharp";
import type { ApiEnvelope } from "@/domain/contact-request";
import {
  detectQualificationDocumentMime,
  normalizeOriginalDocumentName,
  qualificationDocumentExtension,
} from "@/domain/document-security";
import {
  identityDocumentSubmissionSchema,
  MAX_IDENTITY_DOCUMENTS,
  type IdentityDocumentItem,
} from "@/domain/identity-document";
import {
  MAX_QUALIFICATION_UPLOAD_BYTES,
  qualificationAcceptedMimeTypes,
  type QualificationDocumentMime,
} from "@/domain/professional-qualification";
import { getAppSession } from "@/lib/auth/session";
import { sendIdentitySubmissionEmails } from "@/lib/email/smtp";
import { scanDocumentBuffer } from "@/lib/security/document-scanner";
import { createPrivilegedClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;
const MAX_MULTIPART_BYTES = MAX_QUALIFICATION_UPLOAD_BYTES + 256 * 1024;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ data: null, error: { code, message }, meta: { source: "supabase" } } satisfies ApiEnvelope<never>, { status, headers: privateHeaders });
}

async function sanitizeDocument(source: Buffer, mime: QualificationDocumentMime): Promise<Buffer> {
  if (mime === "application/pdf") return source;
  const image = sharp(source, { failOn: "error", limitInputPixels: 50_000_000 }).rotate();
  return mime === "image/jpeg" ? image.jpeg({ quality: 90, mozjpeg: true }).toBuffer() : image.png({ compressionLevel: 9 }).toBuffer();
}

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session || session.source !== "supabase" || !session.userId || !["technician", "company"].includes(session.role)) return errorResponse("UNAUTHORIZED", "Inicia sesión como técnico o empresa.", 401);
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) return errorResponse("PAYLOAD_TOO_LARGE", "El documento no puede superar 10 MB.", 413);

  let formData: FormData;
  try { formData = await request.formData(); } catch { return errorResponse("INVALID_FORM", "No fue posible leer el formulario.", 400); }
  const parsed = identityDocumentSubmissionSchema.safeParse({ documentType: formData.get("documentType"), subjectName: formData.get("subjectName") });
  if (!parsed.success) return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Revisa los datos.", 400);
  if (session.role === "technician" && parsed.data.documentType === "company_tax_document") return errorResponse("INVALID_DOCUMENT_TYPE", "El documento tributario está disponible para perfiles de empresa.", 400);

  const document = formData.get("document");
  if (!(document instanceof File) || document.size === 0) return errorResponse("DOCUMENT_REQUIRED", "Selecciona un documento.", 400);
  if (document.size > MAX_QUALIFICATION_UPLOAD_BYTES) return errorResponse("PAYLOAD_TOO_LARGE", "El documento no puede superar 10 MB.", 413);
  if (!qualificationAcceptedMimeTypes.includes(document.type as QualificationDocumentMime)) return errorResponse("UNSUPPORTED_DOCUMENT", "Usa PDF, JPG o PNG.", 415);

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase.from("professional_profiles").select("id,display_name").eq("owner_user_id", session.userId).maybeSingle();
  if (profileError || !profile) return errorResponse("PROFILE_NOT_FOUND", "No encontramos tu perfil profesional.", 404);
  const { count, error: countError } = await supabase.from("identity_documents").select("id", { count: "exact", head: true }).eq("profile_id", profile.id);
  if (countError) return errorResponse("DOCUMENTS_UNAVAILABLE", "No fue posible comprobar tus documentos.", 503);
  if ((count ?? 0) >= MAX_IDENTITY_DOCUMENTS) return errorResponse("DOCUMENT_LIMIT", `Ya alcanzaste el máximo de ${MAX_IDENTITY_DOCUMENTS} documentos.`, 409);

  let processed: Buffer;
  let actualMime: QualificationDocumentMime;
  try {
    const source = Buffer.from(await document.arrayBuffer());
    const detected = detectQualificationDocumentMime(source);
    if (!detected || detected !== document.type) return errorResponse("INVALID_DOCUMENT", "El contenido no coincide con el tipo declarado.", 415);
    actualMime = detected;
    processed = await sanitizeDocument(source, detected);
  } catch { return errorResponse("INVALID_DOCUMENT", "El documento está dañado o no puede procesarse.", 400); }

  const fileId = randomUUID();
  const extension = qualificationDocumentExtension(actualMime);
  const path = `${session.userId}/${fileId}.${extension}`;
  const originalFileName = normalizeOriginalDocumentName(document.name);
  const sha256 = createHash("sha256").update(processed).digest("hex");
  const { error: quarantineError } = await supabase.storage.from("quarantine").upload(path, processed, { cacheControl: "0", contentType: actualMime, upsert: false });
  if (quarantineError) return errorResponse("QUARANTINE_FAILED", "No fue posible aislar el documento para analizarlo.", 503);

  let scan;
  try { scan = await scanDocumentBuffer(processed); } catch {
    await supabase.storage.from("quarantine").remove([path]);
    return errorResponse("SCANNER_UNAVAILABLE", "El análisis de seguridad no está disponible.", 503);
  }
  if (!scan.clean) {
    await supabase.storage.from("quarantine").remove([path]);
    return errorResponse("DOCUMENT_REJECTED", "El archivo fue rechazado por el control de seguridad.", 422);
  }

  let privileged;
  try { privileged = createPrivilegedClient(); } catch {
    await supabase.storage.from("quarantine").remove([path]);
    return errorResponse("SECURE_STORAGE_UNAVAILABLE", "El almacenamiento privado no está disponible.", 503);
  }
  const { error: uploadError } = await privileged.storage.from("identity-documents").upload(path, processed, { cacheControl: "0", contentType: actualMime, upsert: false, metadata: { scanStatus: "clean", sha256, scanEngine: scan.engine } });
  await supabase.storage.from("quarantine").remove([path]);
  if (uploadError) return errorResponse("UPLOAD_FAILED", "El documento se analizó, pero no pudo guardarse.", 503);

  const { data: inserted, error: insertError } = await privileged.from("identity_documents").insert({
    profile_id: profile.id,
    document_type: parsed.data.documentType,
    subject_name: parsed.data.subjectName,
    document_path: path,
    original_file_name: originalFileName,
    mime_type: actualMime,
    file_size_bytes: processed.length,
    sha256,
    scan_status: "clean",
    scanned_at: new Date().toISOString(),
    scan_engine: scan.engine,
    status: "pending_review",
  }).select("id,created_at").single();
  if (insertError || !inserted) {
    await privileged.storage.from("identity-documents").remove([path]);
    return errorResponse("DOCUMENTS_UNAVAILABLE", "El documento se analizó, pero no pudo registrarse.", 503);
  }

  revalidatePath("/panel/identidad");
  revalidatePath("/admin/documentos");
  let email: "sent" | "partial" | "failed" | "skipped" = "skipped";
  try { email = await sendIdentitySubmissionEmails({ applicantEmail: session.email, applicantName: session.displayName ?? profile.display_name, professionalName: profile.display_name, documentType: parsed.data.documentType }); } catch { email = "failed"; }
  const data: IdentityDocumentItem = { id: inserted.id, documentType: parsed.data.documentType, subjectName: parsed.data.subjectName, status: "pending_review", reviewReason: null, originalFileName, fileSizeBytes: processed.length, hasDocument: true, scanStatus: "clean", createdAt: inserted.created_at };
  return NextResponse.json({ data, error: null, meta: { source: "supabase", moderation: "pending", email } } satisfies ApiEnvelope<IdentityDocumentItem>, { status: 201, headers: privateHeaders });
}
