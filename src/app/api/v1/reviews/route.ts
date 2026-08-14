import { NextResponse } from "next/server";
import type { ApiEnvelope } from "@/domain/contact-request";
import { createReviewSchema, type ReviewReceipt } from "@/domain/review";
import { createDemoReview } from "@/lib/contact-requests/demo-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fixturesMeta = { source: "fixtures", persistence: "memory", demo: true, moderation: "pending" } as const;
const privateResponseHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;
const MAX_REQUEST_BODY_BYTES = 8 * 1024;

export async function POST(request: Request) {
  if (process.env.APP_DATA_SOURCE !== "fixtures") {
    return NextResponse.json(
      {
        data: null,
        error: { code: "FIXTURE_MODE_REQUIRED", message: "Las evaluaciones locales solo están disponibles en modo demo." },
        meta: null,
      } satisfies ApiEnvelope<never>,
      { status: 503, headers: privateResponseHeaders },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "PAYLOAD_TOO_LARGE", message: "La evaluación supera el tamaño permitido." },
        meta: fixturesMeta,
      } satisfies ApiEnvelope<never, typeof fixturesMeta>,
      { status: 413, headers: privateResponseHeaders },
    );
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BODY_BYTES) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "PAYLOAD_TOO_LARGE", message: "La evaluación supera el tamaño permitido." },
          meta: fixturesMeta,
        } satisfies ApiEnvelope<never, typeof fixturesMeta>,
        { status: 413, headers: privateResponseHeaders },
      );
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "INVALID_JSON", message: "El cuerpo de la evaluación no contiene JSON válido." },
        meta: null,
      } satisfies ApiEnvelope<never>,
      { status: 400, headers: privateResponseHeaders },
    );
  }

  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Revisa la calificación y el comentario.",
          fields: parsed.error.flatten().fieldErrors,
        },
        meta: fixturesMeta,
      } satisfies ApiEnvelope<never, typeof fixturesMeta>,
      { status: 400, headers: privateResponseHeaders },
    );
  }

  const result = createDemoReview(parsed.data);
  if (!result.ok) {
    const status = result.error === "REQUEST_NOT_FOUND" ? 404 : 409;
    const message = {
      REQUEST_NOT_FOUND: "El enlace de seguimiento no es válido o ya no está disponible.",
      REQUEST_NOT_ELIGIBLE: "La solicitud debe estar completada antes de evaluar.",
      REVIEW_ALREADY_SUBMITTED: "Esta solicitud ya tiene una evaluación registrada.",
    }[result.error];

    return NextResponse.json(
      {
        data: null,
        error: { code: result.error, message },
        meta: fixturesMeta,
      } satisfies ApiEnvelope<never, typeof fixturesMeta>,
      { status, headers: privateResponseHeaders },
    );
  }

  return NextResponse.json(
    { data: result.data, error: null, meta: fixturesMeta } satisfies ApiEnvelope<ReviewReceipt, typeof fixturesMeta>,
    { status: 201, headers: privateResponseHeaders },
  );
}
