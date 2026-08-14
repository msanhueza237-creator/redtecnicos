import { NextResponse } from "next/server";
import {
  type ApiEnvelope,
  type ContactRequestTracking,
  trackingTokenSchema,
} from "@/domain/contact-request";
import { completeDemoContactRequest } from "@/lib/contact-requests/demo-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fixturesMeta = { source: "fixtures", persistence: "memory", demo: true } as const;
const privateResponseHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ trackingToken: string }> },
) {
  if (process.env.APP_DATA_SOURCE !== "fixtures") {
    return NextResponse.json(
      {
        data: null,
        error: { code: "FIXTURE_MODE_REQUIRED", message: "Esta acción solo está disponible en modo demo." },
        meta: null,
      } satisfies ApiEnvelope<never>,
      { status: 503, headers: privateResponseHeaders },
    );
  }

  const parsedToken = trackingTokenSchema.safeParse((await params).trackingToken);
  if (!parsedToken.success) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "REQUEST_NOT_FOUND", message: "El enlace de seguimiento no es válido o ya no está disponible." },
        meta: fixturesMeta,
      } satisfies ApiEnvelope<never, typeof fixturesMeta>,
      { status: 404, headers: privateResponseHeaders },
    );
  }

  const result = completeDemoContactRequest(parsedToken.data);
  if (!result.ok) {
    const notFound = result.error === "REQUEST_NOT_FOUND";
    return NextResponse.json(
      {
        data: null,
        error: {
          code: result.error,
          message: notFound
            ? "El enlace de seguimiento no es válido o ya no está disponible."
            : "Esta solicitud no puede marcarse como completada.",
        },
        meta: fixturesMeta,
      } satisfies ApiEnvelope<never, typeof fixturesMeta>,
      { status: notFound ? 404 : 409, headers: privateResponseHeaders },
    );
  }

  return NextResponse.json(
    { data: result.data, error: null, meta: fixturesMeta } satisfies ApiEnvelope<ContactRequestTracking, typeof fixturesMeta>,
    { headers: privateResponseHeaders },
  );
}
