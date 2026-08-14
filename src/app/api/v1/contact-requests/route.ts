import { NextResponse } from "next/server";
import { getDemoProfessionalContact } from "@/data/demo-professional-contacts";
import { getProfessionalBySlug } from "@/data/demo-professionals";
import {
  type ApiEnvelope,
  type ContactRequestReceipt,
  createContactRequestSchema,
} from "@/domain/contact-request";
import { createDemoContactRequest } from "@/lib/contact-requests/demo-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fixturesMeta = { source: "fixtures", persistence: "memory", demo: true } as const;
const MAX_REQUEST_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  if (process.env.APP_DATA_SOURCE !== "fixtures") {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "FIXTURE_MODE_REQUIRED",
          message: "Las solicitudes locales solo están disponibles en modo fixtures.",
        },
        meta: null,
      } satisfies ApiEnvelope<never>,
      { status: 503 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "PAYLOAD_TOO_LARGE", message: "La solicitud supera el tamaño permitido." },
        meta: fixturesMeta,
      } satisfies ApiEnvelope<never, typeof fixturesMeta>,
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BODY_BYTES) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "PAYLOAD_TOO_LARGE", message: "La solicitud supera el tamaño permitido." },
          meta: fixturesMeta,
        } satisfies ApiEnvelope<never, typeof fixturesMeta>,
        { status: 413 },
      );
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "INVALID_JSON", message: "El cuerpo de la solicitud no contiene JSON válido." },
        meta: null,
      } satisfies ApiEnvelope<never>,
      { status: 400 },
    );
  }

  const parsed = createContactRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Revisa los datos ingresados.",
          fields: parsed.error.flatten().fieldErrors,
        },
        meta: fixturesMeta,
      } satisfies ApiEnvelope<never, typeof fixturesMeta>,
      { status: 400 },
    );
  }

  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES === "false") {
    return NextResponse.json(
      {
        data: null,
        error: { code: "PROFESSIONAL_NOT_FOUND", message: "El perfil no está disponible." },
        meta: fixturesMeta,
      } satisfies ApiEnvelope<never, typeof fixturesMeta>,
      { status: 404 },
    );
  }

  const directoryProfessional = getProfessionalBySlug(parsed.data.professionalSlug);
  const professional = getDemoProfessionalContact(parsed.data.professionalId, parsed.data.professionalSlug);
  if (!directoryProfessional || directoryProfessional.id !== parsed.data.professionalId || !professional) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "PROFESSIONAL_NOT_FOUND", message: "El perfil no está disponible." },
        meta: fixturesMeta,
      } satisfies ApiEnvelope<never, typeof fixturesMeta>,
      { status: 404 },
    );
  }

  if (
    !directoryProfessional.communes.includes(parsed.data.commune) ||
    !directoryProfessional.services.includes(parsed.data.service)
  ) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INVALID_PROFILE_SELECTION",
          message: "Selecciona una comuna y un servicio disponibles en este perfil.",
        },
        meta: fixturesMeta,
      } satisfies ApiEnvelope<never, typeof fixturesMeta>,
      { status: 400 },
    );
  }

  const data = createDemoContactRequest(parsed.data, professional);
  return NextResponse.json(
    { data, error: null, meta: fixturesMeta } satisfies ApiEnvelope<ContactRequestReceipt, typeof fixturesMeta>,
    { status: 201 },
  );
}
