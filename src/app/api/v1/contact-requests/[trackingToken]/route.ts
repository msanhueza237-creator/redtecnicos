import { NextResponse } from "next/server";
import {
  type ApiEnvelope,
  type ContactRequestTracking,
  trackingTokenSchema,
} from "@/domain/contact-request";
import { getDemoContactRequestTracking } from "@/lib/contact-requests/demo-store";
import { getLiveContactRequestTracking } from "@/lib/contact-requests/repository";
import { isSupabaseMode } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fixturesMeta = { source: "fixtures", persistence: "memory", demo: true } as const;
const privateResponseHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trackingToken: string }> },
) {
  const parsedToken = trackingTokenSchema.safeParse((await params).trackingToken);
  let data: ContactRequestTracking | undefined;
  try {
    data = parsedToken.success
      ? isSupabaseMode()
        ? await getLiveContactRequestTracking(parsedToken.data)
        : getDemoContactRequestTracking(parsedToken.data)
      : undefined;
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "TRACKING_UNAVAILABLE", message: "El seguimiento no está disponible temporalmente." }, meta: null } satisfies ApiEnvelope<never>,
      { status: 503, headers: privateResponseHeaders },
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "REQUEST_NOT_FOUND", message: "El enlace de seguimiento no es válido o ya no está disponible." },
        meta: isSupabaseMode() ? { source: "supabase" } : fixturesMeta,
      } satisfies ApiEnvelope<never>,
      { status: 404, headers: privateResponseHeaders },
    );
  }

  return NextResponse.json(
    { data, error: null, meta: isSupabaseMode() ? { source: "supabase" } : fixturesMeta } satisfies ApiEnvelope<ContactRequestTracking>,
    { headers: privateResponseHeaders },
  );
}
