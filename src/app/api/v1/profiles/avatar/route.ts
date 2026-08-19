import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import sharp from "sharp";
import type { ApiEnvelope } from "@/domain/contact-request";
import {
  MAX_PROFILE_AVATAR_BYTES,
  profileAvatarAcceptedMimeTypes,
} from "@/domain/professional-profile";
import { getAppSession } from "@/lib/auth/session";
import { notifyAdministratorOfProfessionalChange } from "@/lib/professional/change-notifications";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;
const MAX_MULTIPART_BYTES = MAX_PROFILE_AVATAR_BYTES + 128 * 1024;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { data: null, error: { code, message }, meta: { source: "supabase" } } satisfies ApiEnvelope<never>,
    { status, headers: privateHeaders },
  );
}

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session || session.source !== "supabase" || !session.userId || !["technician", "company"].includes(session.role)) {
    return errorResponse("UNAUTHORIZED", "Inicia sesión como técnico o empresa para cargar una fotografía.", 401);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
    return errorResponse("PAYLOAD_TOO_LARGE", "La fotografía no puede superar 5 MB.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("INVALID_FORM", "No fue posible leer la fotografía.", 400);
  }

  const avatar = formData.get("avatar");
  if (!(avatar instanceof File) || avatar.size === 0) {
    return errorResponse("IMAGE_REQUIRED", "Selecciona una fotografía o logotipo.", 400);
  }
  if (avatar.size > MAX_PROFILE_AVATAR_BYTES) {
    return errorResponse("PAYLOAD_TOO_LARGE", "La fotografía no puede superar 5 MB.", 413);
  }
  if (!profileAvatarAcceptedMimeTypes.includes(avatar.type as (typeof profileAvatarAcceptedMimeTypes)[number])) {
    return errorResponse("UNSUPPORTED_IMAGE", "Usa una imagen JPG, PNG, WebP o AVIF.", 415);
  }

  let processed: Buffer;
  try {
    const source = Buffer.from(await avatar.arrayBuffer());
    const metadata = await sharp(source, { failOn: "error", limitInputPixels: 30_000_000 }).metadata();
    if (!metadata.format || !["jpeg", "png", "webp", "avif"].includes(metadata.format)) {
      return errorResponse("UNSUPPORTED_IMAGE", "El contenido del archivo no corresponde a una imagen permitida.", 415);
    }
    processed = await sharp(source, { failOn: "error", limitInputPixels: 30_000_000 })
      .rotate()
      .resize({ width: 512, height: 512, fit: "cover", position: "attention" })
      .webp({ quality: 86, effort: 4 })
      .toBuffer();
  } catch {
    return errorResponse("INVALID_IMAGE", "La imagen está dañada o no puede procesarse.", 400);
  }

  const supabase = await createClient();
  const avatarPath = `${session.userId}/avatar-${randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage.from("profile-images").upload(avatarPath, processed, {
    cacheControl: "31536000",
    contentType: "image/webp",
    upsert: false,
  });
  if (uploadError) return errorResponse("UPLOAD_FAILED", "No fue posible guardar la fotografía.", 503);

  const { error: profileError } = await supabase.rpc("set_owned_profile_avatar", { p_avatar_path: avatarPath });
  if (profileError) {
    await supabase.storage.from("profile-images").remove([avatarPath]);
    return errorResponse("PROFILE_UPDATE_FAILED", "La imagen fue procesada, pero no pudo asociarse al perfil.", 503);
  }

  const { data: signed, error: signedError } = await supabase.storage.from("profile-images").createSignedUrl(avatarPath, 60 * 60);
  if (signedError || !signed?.signedUrl) {
    return errorResponse("PREVIEW_UNAVAILABLE", "La fotografía quedó guardada, pero no pudimos mostrar su vista previa.", 503);
  }

  await notifyAdministratorOfProfessionalChange(session, "Fotografía profesional");

  revalidatePath("/panel");
  revalidatePath("/panel/perfil");
  revalidatePath("/admin/postulaciones");
  return NextResponse.json(
    { data: { avatarUrl: signed.signedUrl, status: "pending_review" }, error: null, meta: { source: "supabase", moderation: "pending" } },
    { status: 201, headers: privateHeaders },
  );
}
