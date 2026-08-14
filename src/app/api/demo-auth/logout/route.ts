import { NextResponse, type NextRequest } from "next/server";
import { clearDemoSession } from "@/lib/auth/demo-session";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const requestHost = (
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  )?.split(",")[0]?.trim();
  const requestProtocol = (
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol
  ).replace(":", "");

  let isSameOrigin = false;
  try {
    const originUrl = origin ? new URL(origin) : null;
    isSameOrigin = Boolean(
      originUrl && requestHost && originUrl.host === requestHost && originUrl.protocol === `${requestProtocol}:`,
    );
  } catch {
    isSameOrigin = false;
  }

  if (!isSameOrigin) {
    return NextResponse.json(
      { data: null, error: { code: "forbidden_origin", message: "Origen no permitido." }, meta: null },
      { status: 403 },
    );
  }

  await clearDemoSession();
  const entryPath = request.nextUrl.searchParams.get("area") === "administracion"
    ? "/acceso-demo/administracion"
    : "/acceso-demo";
  return NextResponse.redirect(new URL(`${entryPath}?logout=1`, origin!), 303);
}
