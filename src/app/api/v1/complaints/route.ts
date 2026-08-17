import { NextResponse } from "next/server";
import {
  createComplaintSchema,
  type ComplaintReceipt,
} from "@/domain/complaint";
import type { ApiEnvelope } from "@/domain/contact-request";
import { createLiveComplaint } from "@/lib/complaints/repository";
import { isSupabaseMode } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BODY_BYTES = 24 * 1024;
const liveMeta = { source: "supabase", persistence: "database", demo: false } as const;
const fixturesMeta = { source: "fixtures", persistence: "none", demo: true } as const;

function mappedError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("RATE_LIMIT_EXCEEDED")) {
    return { status: 429, code: "RATE_LIMIT_EXCEEDED", message: "Se alcanzó el límite de reportes. Espera antes de volver a intentarlo." };
  }
  if (message.includes("RATE_LIMIT_NOT_CONFIGURED")) {
    return { status: 503, code: "SERVICE_NOT_CONFIGURED", message: "El canal todavía no está disponible." };
  }
  return { status: 503, code: "COMPLAINT_SERVICE_UNAVAILABLE", message: "No pudimos registrar el reporte. Inténtalo nuevamente." };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
    return NextResponse.json(
      { data: null, error: { code: "PAYLOAD_TOO_LARGE", message: "El reporte supera el tamaño permitido." }, meta: null } satisfies ApiEnvelope<never>,
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
    body = JSON.parse(rawBody) as unknown;
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE";
    return NextResponse.json(
      { data: null, error: { code: tooLarge ? "PAYLOAD_TOO_LARGE" : "INVALID_JSON", message: tooLarge ? "El reporte supera el tamaño permitido." : "El contenido del reporte no es válido." }, meta: null } satisfies ApiEnvelope<never>,
      { status: tooLarge ? 413 : 400 },
    );
  }

  const parsed = createComplaintSchema.safeParse(body);
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

  if (!isSupabaseMode()) {
    return NextResponse.json(
      {
        data: { caseNumber: "REC-DEMO-0001", status: "new", createdAt: new Date().toISOString() },
        error: null,
        meta: fixturesMeta,
      } satisfies ApiEnvelope<ComplaintReceipt, typeof fixturesMeta>,
      { status: 201 },
    );
  }

  try {
    const data = await createLiveComplaint(parsed.data, request);
    return NextResponse.json(
      { data, error: null, meta: liveMeta } satisfies ApiEnvelope<ComplaintReceipt, typeof liveMeta>,
      { status: 201 },
    );
  } catch (error) {
    const mapped = mappedError(error);
    return NextResponse.json(
      { data: null, error: { code: mapped.code, message: mapped.message }, meta: liveMeta } satisfies ApiEnvelope<never>,
      { status: mapped.status },
    );
  }
}
