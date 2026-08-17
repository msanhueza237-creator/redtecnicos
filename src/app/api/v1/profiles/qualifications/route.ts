import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import {
  detectQualificationDocumentMime,
  normalizeOriginalDocumentName,
  qualificationDocumentExtension,
} from "@/domain/document-security";
import {
  MAX_QUALIFICATIONS,
  MAX_QUALIFICATION_UPLOAD_BYTES,
  qualificationAcceptedMimeTypes,
  qualificationSubmissionSchema,
  type ProfessionalQualificationItem,
  type QualificationDocumentMime,
} from "@/domain/professional-qualification";
import type { ApiEnvelope } from "@/domain/contact-request";
import { getAppSession } from "@/lib/auth/session";
import { sendQualificationSubmissionEmails } from "@/lib/email/smtp";
import { scanDocumentBuffer } from "@/lib/security/document-scanner";
import { createPrivilegedClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;
const MAX_MULTIPART_BYTES = MAX_QUALIFICATION_UPLOAD_BYTES + 256 * 1024;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { data: null, error: { code, message }, meta: { source: "supabase" } } satisfies ApiEnvelope<never>,
    { status, headers: privateHeaders },
  );
}

async function sanitizeDocument(source: Buffer, mime: QualificationDocumentMime): Promise<Buffer> {
  if (mime === "application/pdf") return source;
  const image = sharp(source, { failOn: "error", limitInputPixels: 50_000_000 }).rotate();
  if (mime === "image/jpeg") return image.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  return image.png({ compressionLevel: 9 }).toBuffer();
}

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session || session.source !== "supabase" || !session.userId || !["technician", "company"].includes(session.role)) {
    return errorResponse("UNAUTHORIZED", "Inicia sesión como técnico o empresa para cargar documentos.", 401);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
    return errorResponse("PAYLOAD_TOO_LARGE", "El documento no puede superar 10 MB.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("INVALID_FORM", "No fue posible leer el formulario del documento.", 400);
  }

  const parsed = qualificationSubmissionSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    institution: formData.get("institution"),
    issuedYear: formData.get("issuedYear"),
    expiresAt: formData.get("expiresAt"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Revisa los datos de la formación.",
          fields: parsed.error.flatten().fieldErrors,
        },
        meta: { source: "supabase" },
      } satisfies ApiEnvelope<never>,
      { status: 400, headers: privateHeaders },
    );
  }

  const document = formData.get("document");
  if (!(document instanceof File) || document.size === 0) {
    return errorResponse("DOCUMENT_REQUIRED", "Selecciona el documento de respaldo.", 400);
  }
  if (document.size > MAX_QUALIFICATION_UPLOAD_BYTES) {
    return errorResponse("PAYLOAD_TOO_LARGE", "El documento no puede superar 10 MB.", 413);
  }
  if (!qualificationAcceptedMimeTypes.includes(document.type as QualificationDocumentMime)) {
    return errorResponse("UNSUPPORTED_DOCUMENT", "Usa un archivo PDF, JPG o PNG.", 415);
  }

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select("id,display_name")
    .eq("owner_user_id", session.userId)
    .maybeSingle();
  if (profileError || !profile) {
    return errorResponse("PROFILE_NOT_FOUND", "No encontramos el perfil profesional asociado a tu cuenta.", 404);
  }

  const { count, error: countError } = await supabase
    .from("qualifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profile.id);
  if (countError) return errorResponse("DOCUMENTS_UNAVAILABLE", "No fue posible comprobar tus documentos.", 503);
  if ((count ?? 0) >= MAX_QUALIFICATIONS) {
    return errorResponse("DOCUMENT_LIMIT", `Tu perfil ya contiene el máximo de ${MAX_QUALIFICATIONS} antecedentes.`, 409);
  }

  let processed: Buffer;
  let actualMime: QualificationDocumentMime;
  try {
    const source = Buffer.from(await document.arrayBuffer());
    const detected = detectQualificationDocumentMime(source);
    if (!detected || detected !== document.type) {
      return errorResponse("INVALID_DOCUMENT", "El contenido del archivo no coincide con su tipo declarado.", 415);
    }
    actualMime = detected;
    processed = await sanitizeDocument(source, detected);
  } catch {
    return errorResponse("INVALID_DOCUMENT", "El documento está dañado o no puede procesarse.", 400);
  }

  const fileId = randomUUID();
  const extension = qualificationDocumentExtension(actualMime);
  const quarantinePath = `${session.userId}/${fileId}.${extension}`;
  const finalPath = `${session.userId}/${fileId}.${extension}`;
  const originalFileName = normalizeOriginalDocumentName(document.name);
  const sha256 = createHash("sha256").update(processed).digest("hex");

  const { error: quarantineError } = await supabase.storage
    .from("quarantine")
    .upload(quarantinePath, processed, {
      cacheControl: "0",
      contentType: actualMime,
      upsert: false,
    });
  if (quarantineError) {
    return errorResponse("QUARANTINE_FAILED", "No fue posible aislar el documento para analizarlo.", 503);
  }

  let scan;
  try {
    scan = await scanDocumentBuffer(processed);
  } catch {
    await supabase.storage.from("quarantine").remove([quarantinePath]);
    return errorResponse("SCANNER_UNAVAILABLE", "El análisis de seguridad no está disponible. Inténtalo nuevamente más tarde.", 503);
  }
  if (!scan.clean) {
    await supabase.storage.from("quarantine").remove([quarantinePath]);
    return errorResponse("DOCUMENT_REJECTED", "El archivo fue rechazado por el control de seguridad.", 422);
  }

  let privileged;
  try {
    privileged = createPrivilegedClient();
  } catch {
    await supabase.storage.from("quarantine").remove([quarantinePath]);
    return errorResponse("SECURE_STORAGE_UNAVAILABLE", "El almacenamiento documental seguro no está disponible.", 503);
  }

  const { error: finalUploadError } = await privileged.storage
    .from("qualification-documents")
    .upload(finalPath, processed, {
      cacheControl: "0",
      contentType: actualMime,
      upsert: false,
      metadata: { scanStatus: "clean", sha256, scanEngine: scan.engine },
    });
  await supabase.storage.from("quarantine").remove([quarantinePath]);
  if (finalUploadError) {
    return errorResponse("UPLOAD_FAILED", "El documento fue analizado, pero no pudo guardarse.", 503);
  }

  const { data: inserted, error: insertError } = await privileged
    .from("qualifications")
    .insert({
      profile_id: profile.id,
      qualification_type: parsed.data.type,
      title: parsed.data.title,
      institution: parsed.data.institution,
      issued_year: parsed.data.issuedYear,
      expires_at: parsed.data.expiresAt,
      document_path: finalPath,
      status: "pending_review",
      original_file_name: originalFileName,
      mime_type: actualMime,
      file_size_bytes: processed.length,
      sha256,
      scan_status: "clean",
      scanned_at: new Date().toISOString(),
      scan_engine: scan.engine,
    })
    .select("id,created_at")
    .single();

  if (insertError || !inserted) {
    await privileged.storage.from("qualification-documents").remove([finalPath]);
    return errorResponse("DOCUMENTS_UNAVAILABLE", "El documento se analizó, pero no fue posible registrarlo.", 503);
  }

  let emailStatus: "sent" | "partial" | "failed" | "skipped" = "skipped";
  try {
    emailStatus = await sendQualificationSubmissionEmails({
      applicantEmail: session.email,
      applicantName: session.displayName ?? profile.display_name,
      professionalName: profile.display_name,
      qualificationTitle: parsed.data.title,
      qualificationType: parsed.data.type,
    });
  } catch {
    emailStatus = "failed";
  }

  const data: ProfessionalQualificationItem = {
    id: inserted.id,
    type: parsed.data.type,
    title: parsed.data.title,
    institution: parsed.data.institution,
    issuedYear: parsed.data.issuedYear,
    expiresAt: parsed.data.expiresAt,
    status: "pending_review",
    reviewReason: null,
    createdAt: inserted.created_at,
    originalFileName,
    fileSizeBytes: processed.length,
    hasDocument: true,
    scanStatus: "clean",
  };

  return NextResponse.json(
    { data, error: null, meta: { source: "supabase", moderation: "pending", email: emailStatus } } satisfies ApiEnvelope<ProfessionalQualificationItem>,
    { status: 201, headers: privateHeaders },
  );
}
