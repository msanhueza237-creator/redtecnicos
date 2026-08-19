import { NextResponse } from "next/server";
import { z } from "zod";
import { recordPublicProfileView } from "@/lib/analytics/profile-views";
import { isSupabaseMode } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
});
const botPattern = /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp|telegrambot|headless/i;
const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;

export async function POST(request: Request) {
  if (!isSupabaseMode()) return new NextResponse(null, { status: 204, headers: noStoreHeaders });

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site"].includes(fetchSite)) {
    return new NextResponse(null, { status: 204, headers: noStoreHeaders });
  }
  if (botPattern.test(request.headers.get("user-agent") ?? "")) {
    return new NextResponse(null, { status: 204, headers: noStoreHeaders });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 2048) {
    return new NextResponse(null, { status: 413, headers: noStoreHeaders });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return new NextResponse(null, { status: 400, headers: noStoreHeaders });
  }
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return new NextResponse(null, { status: 400, headers: noStoreHeaders });

  try {
    await recordPublicProfileView(parsed.data.slug, request);
  } catch {
    // La analítica nunca debe impedir que una persona consulte un perfil.
  }
  return new NextResponse(null, { status: 204, headers: noStoreHeaders });
}
