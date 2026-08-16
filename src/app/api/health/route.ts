import { NextResponse } from "next/server";
import { smtpConfigurationStatus } from "@/lib/email/smtp";

export const dynamic = "force-dynamic";

export function GET() {
  const dataSource = process.env.APP_DATA_SOURCE === "supabase" ? "supabase" : "fixtures";
  return NextResponse.json(
    {
      status: "ok",
      connection: dataSource === "fixtures" ? "fixtures" : "configured",
      email: smtpConfigurationStatus(),
      version: process.env.APP_VERSION ?? "0.1.0",
      buildDate: process.env.BUILD_DATE ?? "local",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
