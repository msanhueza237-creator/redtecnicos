import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { trackingTokenSchema } from "@/domain/contact-request";
import { verifyLiveContactRequestEmail } from "@/lib/contact-requests/repository";
import { publicSiteUrl } from "@/lib/site-url";
import { isSupabaseMode } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ verificationToken: string }> },
) {
  const tracking = trackingTokenSchema.safeParse(request.nextUrl.searchParams.get("tracking") ?? "");
  const verification = trackingTokenSchema.safeParse((await params).verificationToken);

  if (!isSupabaseMode() || !tracking.success || !verification.success) {
    return NextResponse.redirect(publicSiteUrl("/tecnicos?verification=invalid"), 303);
  }

  try {
    await verifyLiveContactRequestEmail(verification.data, tracking.data);
    return NextResponse.redirect(publicSiteUrl(`/seguimiento/${encodeURIComponent(tracking.data)}?verification=success`), 303);
  } catch {
    return NextResponse.redirect(publicSiteUrl(`/seguimiento/${encodeURIComponent(tracking.data)}?verification=error`), 303);
  }
}
