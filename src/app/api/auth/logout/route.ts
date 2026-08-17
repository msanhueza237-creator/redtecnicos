import { NextResponse, type NextRequest } from "next/server";
import { clearDemoSession } from "@/lib/auth/demo-session";
import { publicSiteUrl } from "@/lib/site-url";
import { isSupabaseAuthMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function hasSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const requestHost = (
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  )?.split(",")[0]?.trim();
  const requestProtocol = (
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol
  ).replace(":", "");

  try {
    const originUrl = origin ? new URL(origin) : null;
    return Boolean(
      originUrl &&
      requestHost &&
      originUrl.host === requestHost &&
      originUrl.protocol === `${requestProtocol}:`,
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { data: null, error: { code: "forbidden_origin", message: "Origen no permitido." }, meta: null },
      { status: 403 },
    );
  }

  if (isSupabaseAuthMode() && isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.redirect(publicSiteUrl("/ingresar?logout=1"), 303);
  }

  await clearDemoSession();
  const entryPath = request.nextUrl.searchParams.get("area") === "administracion"
    ? "/acceso-demo/administracion"
    : "/acceso-demo";
  return NextResponse.redirect(publicSiteUrl(`${entryPath}?logout=1`), 303);
}
