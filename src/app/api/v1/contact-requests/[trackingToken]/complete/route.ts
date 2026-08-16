import { NextResponse } from "next/server";
import {
  type ApiEnvelope,
  type ContactRequestTracking,
  trackingTokenSchema,
} from "@/domain/contact-request";
import { completeDemoContactRequest } from "@/lib/contact-requests/demo-store";
import {
  completeLiveContactRequest,
  getLiveReviewInvitationContext,
} from "@/lib/contact-requests/repository";
import { sendReviewInvitationEmail } from "@/lib/email/smtp";
import { isSupabaseMode } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fixturesMeta = { source: "fixtures", persistence: "memory", demo: true } as const;
const privateResponseHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ trackingToken: string }> },
) {
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

  if (isSupabaseMode()) {
    try {
      const data = await completeLiveContactRequest(parsedToken.data);
      if (!data) throw new Error("REQUEST_NOT_FOUND");
      let email: "sent" | "failed" | "skipped" = "skipped";
      try {
        const invitation = await getLiveReviewInvitationContext(parsedToken.data);
        email = invitation?.emailVerified
          ? await sendReviewInvitationEmail(invitation)
          : "skipped";
      } catch {
        email = "failed";
      }
      return NextResponse.json(
        { data, error: null, meta: { source: "supabase", reviewInvitationEmail: email } } satisfies ApiEnvelope<ContactRequestTracking>,
        { headers: privateResponseHeaders },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const notFound = message.includes("REQUEST_NOT_FOUND");
      const ineligible = message.includes("REQUEST_NOT_ELIGIBLE");
      return NextResponse.json(
        {
          data: null,
          error: {
            code: notFound ? "REQUEST_NOT_FOUND" : ineligible ? "REQUEST_NOT_ELIGIBLE" : "TRACKING_UNAVAILABLE",
            message: notFound ? "El enlace no es válido." : ineligible ? "Esta solicitud no puede marcarse como completada." : "No pudimos actualizar la solicitud.",
          },
          meta: { source: "supabase" },
        } satisfies ApiEnvelope<never>,
        { status: notFound ? 404 : ineligible ? 409 : 503, headers: privateResponseHeaders },
      );
    }
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
