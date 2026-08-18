import { NextResponse } from "next/server";
import { getDemoProfessionalContact } from "@/data/demo-professional-contacts";
import { getProfessionalBySlug } from "@/data/demo-professionals";
import {
  type ApiEnvelope,
  type ContactRequestReceipt,
  createContactRequestSchema,
} from "@/domain/contact-request";
import { createDemoContactRequest } from "@/lib/contact-requests/demo-store";
import { createLiveContactRequest } from "@/lib/contact-requests/repository";
import { sendContactRequestEmails } from "@/lib/email/smtp";
import { isSupabaseMode } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fixturesMeta = { source: "fixtures", persistence: "memory", demo: true } as const;
const liveMeta = { source: "supabase", persistence: "database", demo: false } as const;
const MAX_REQUEST_BODY_BYTES = 16 * 1024;

function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("RATE_LIMIT_EXCEEDED")) {
    return { status: 429, code: "RATE_LIMIT_EXCEEDED", message: "Has realizado varias solicitudes. Espera antes de intentar nuevamente." };
  }
  if (message.includes("PROFESSIONAL_NOT_FOUND") || message.includes("PROFESSIONAL_CONTACT_UNAVAILABLE")) {
    return { status: 404, code: "PROFESSIONAL_NOT_FOUND", message: "El perfil no está disponible." };
  }
  if (message.includes("PROFESSIONAL_NOT_AVAILABLE")) {
    return { status: 409, code: "PROFESSIONAL_NOT_AVAILABLE", message: "Este profesional pausó temporalmente la recepción de nuevas solicitudes." };
  }
  if (message.includes("INVALID_PROFILE_SELECTION")) {
    return { status: 400, code: "INVALID_PROFILE_SELECTION", message: "Selecciona una comuna y un servicio disponibles en este perfil." };
  }
  if (message.includes("RATE_LIMIT_NOT_CONFIGURED")) {
    return { status: 503, code: "SERVICE_NOT_CONFIGURED", message: "El servicio de solicitudes todavía no está disponible." };
  }
  return { status: 503, code: "CONTACT_SERVICE_UNAVAILABLE", message: "No pudimos registrar la solicitud. Intenta nuevamente." };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
    return NextResponse.json(
      { data: null, error: { code: "PAYLOAD_TOO_LARGE", message: "La solicitud supera el tamaño permitido." }, meta: null } satisfies ApiEnvelope<never>,
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BODY_BYTES) {
      return NextResponse.json(
        { data: null, error: { code: "PAYLOAD_TOO_LARGE", message: "La solicitud supera el tamaño permitido." }, meta: null } satisfies ApiEnvelope<never>,
        { status: 413 },
      );
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "El cuerpo de la solicitud no contiene JSON válido." }, meta: null } satisfies ApiEnvelope<never>,
      { status: 400 },
    );
  }

  const parsed = createContactRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "VALIDATION_ERROR", message: "Revisa los datos ingresados.", fields: parsed.error.flatten().fieldErrors },
        meta: isSupabaseMode() ? liveMeta : fixturesMeta,
      } satisfies ApiEnvelope<never>,
      { status: 400 },
    );
  }

  if (isSupabaseMode()) {
    try {
      const created = await createLiveContactRequest(parsed.data, request);
      const delivery = await sendContactRequestEmails(created.email);
      return NextResponse.json(
        { data: created.receipt, error: null, meta: { ...liveMeta, email: delivery } } satisfies ApiEnvelope<ContactRequestReceipt>,
        { status: 201 },
      );
    } catch (error) {
      const mapped = databaseError(error);
      return NextResponse.json(
        { data: null, error: { code: mapped.code, message: mapped.message }, meta: liveMeta } satisfies ApiEnvelope<never>,
        { status: mapped.status },
      );
    }
  }

  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES === "false") {
    return NextResponse.json(
      { data: null, error: { code: "PROFESSIONAL_NOT_FOUND", message: "El perfil no está disponible." }, meta: fixturesMeta } satisfies ApiEnvelope<never>,
      { status: 404 },
    );
  }

  const directoryProfessional = getProfessionalBySlug(parsed.data.professionalSlug);
  const professional = getDemoProfessionalContact(parsed.data.professionalId, parsed.data.professionalSlug);
  if (!directoryProfessional || directoryProfessional.id !== parsed.data.professionalId || !professional) {
    return NextResponse.json(
      { data: null, error: { code: "PROFESSIONAL_NOT_FOUND", message: "El perfil no está disponible." }, meta: fixturesMeta } satisfies ApiEnvelope<never>,
      { status: 404 },
    );
  }

  if (!directoryProfessional.communes.includes(parsed.data.commune) || !directoryProfessional.services.includes(parsed.data.service)) {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_PROFILE_SELECTION", message: "Selecciona una comuna y un servicio disponibles en este perfil." }, meta: fixturesMeta } satisfies ApiEnvelope<never>,
      { status: 400 },
    );
  }

  const data = createDemoContactRequest(parsed.data, professional);
  return NextResponse.json(
    { data, error: null, meta: fixturesMeta } satisfies ApiEnvelope<ContactRequestReceipt, typeof fixturesMeta>,
    { status: 201 },
  );
}
