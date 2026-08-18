import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import {
  galleryAcceptedMimeTypes,
  galleryItemInputSchema,
  MAX_GALLERY_ITEMS,
  MAX_GALLERY_UPLOAD_BYTES,
  nextAvailableGalleryOrder,
  type ProfessionalGalleryItem,
} from "@/domain/professional-gallery";
import type { ApiEnvelope } from "@/domain/contact-request";
import { getAppSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;
const MAX_MULTIPART_BYTES = MAX_GALLERY_UPLOAD_BYTES + 128 * 1024;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { data: null, error: { code, message }, meta: { source: "supabase" } } satisfies ApiEnvelope<never>,
    { status, headers: privateHeaders },
  );
}

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session || session.source !== "supabase" || !session.userId || !["technician", "company"].includes(session.role)) {
    return errorResponse("UNAUTHORIZED", "Inicia sesión como técnico o empresa para cargar fotografías.", 401);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
    return errorResponse("PAYLOAD_TOO_LARGE", "La fotografía no puede superar 8 MB.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("INVALID_FORM", "No fue posible leer el formulario de la fotografía.", 400);
  }

  const parsed = galleryItemInputSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Revisa los datos del trabajo.",
          fields: parsed.error.flatten().fieldErrors,
        },
        meta: { source: "supabase" },
      } satisfies ApiEnvelope<never>,
      { status: 400, headers: privateHeaders },
    );
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return errorResponse("IMAGE_REQUIRED", "Selecciona una fotografía del trabajo.", 400);
  }
  if (image.size > MAX_GALLERY_UPLOAD_BYTES) {
    return errorResponse("PAYLOAD_TOO_LARGE", "La fotografía no puede superar 8 MB.", 413);
  }
  if (!galleryAcceptedMimeTypes.includes(image.type as (typeof galleryAcceptedMimeTypes)[number])) {
    return errorResponse("UNSUPPORTED_IMAGE", "Usa una imagen JPG, PNG, WebP o AVIF.", 415);
  }

  let encodedImage: Buffer;
  try {
    const source = Buffer.from(await image.arrayBuffer());
    const metadata = await sharp(source, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
    if (!metadata.format || !["jpeg", "png", "webp", "avif"].includes(metadata.format)) {
      return errorResponse("UNSUPPORTED_IMAGE", "El contenido del archivo no corresponde a una imagen permitida.", 415);
    }
    encodedImage = await sharp(source, { failOn: "error", limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch {
    return errorResponse("INVALID_IMAGE", "La fotografía está dañada o no puede procesarse.", 400);
  }

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("owner_user_id", session.userId)
    .maybeSingle();
  if (profileError || !profile) {
    return errorResponse("PROFILE_NOT_FOUND", "No encontramos el perfil profesional asociado a tu cuenta.", 404);
  }

  const { data: currentItems, error: currentError } = await supabase
    .from("portfolio_items")
    .select("display_order")
    .eq("profile_id", profile.id)
    .order("display_order");
  if (currentError) return errorResponse("GALLERY_UNAVAILABLE", "No fue posible comprobar tu galería.", 503);
  if ((currentItems?.length ?? 0) >= MAX_GALLERY_ITEMS) {
    return errorResponse("GALLERY_LIMIT", "Tu perfil ya contiene el máximo de cinco fotografías.", 409);
  }

  const displayOrder = nextAvailableGalleryOrder(
    (currentItems ?? []).map((item) => Number(item.display_order)),
  );
  if (!displayOrder) return errorResponse("GALLERY_LIMIT", "Tu perfil ya contiene el máximo de cinco fotografías.", 409);

  const storagePath = `${session.userId}/${randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from("gallery-images")
    .upload(storagePath, encodedImage, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: false,
    });
  if (uploadError) {
    return errorResponse("UPLOAD_FAILED", "No fue posible guardar la fotografía. Inténtalo nuevamente.", 503);
  }

  const altText = `Trabajo realizado: ${parsed.data.title}`;
  const { data: inserted, error: insertError } = await supabase
    .from("portfolio_items")
    .insert({
      profile_id: profile.id,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      storage_path: storagePath,
      alt_text: altText,
      display_order: displayOrder,
      status: "pending_review",
    })
    .select("id,created_at")
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from("gallery-images").remove([storagePath]);
    return errorResponse(
      insertError?.code === "23505" ? "GALLERY_LIMIT" : "GALLERY_UNAVAILABLE",
      insertError?.code === "23505"
        ? "La galería cambió mientras cargabas la fotografía. Actualiza la página e inténtalo otra vez."
        : "La fotografía se procesó, pero no fue posible registrarla.",
      insertError?.code === "23505" ? 409 : 503,
    );
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("gallery-images")
    .createSignedUrl(storagePath, 60 * 60);
  if (signedError || !signed?.signedUrl) {
    return errorResponse("PREVIEW_UNAVAILABLE", "La fotografía quedó guardada, pero no pudimos generar su vista previa.", 503);
  }

  const data: ProfessionalGalleryItem = {
    id: inserted.id,
    title: parsed.data.title,
    category: parsed.data.category,
    description: parsed.data.description,
    altText,
    displayOrder,
    status: "pending_review",
    reviewReason: null,
    createdAt: inserted.created_at,
    imageUrl: signed.signedUrl,
  };

  return NextResponse.json(
    { data, error: null, meta: { source: "supabase", moderation: "pending" } } satisfies ApiEnvelope<ProfessionalGalleryItem>,
    { status: 201, headers: privateHeaders },
  );
}
