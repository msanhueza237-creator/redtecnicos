import "server-only";

import { createHmac } from "node:crypto";
import { createPrivilegedClient } from "@/lib/supabase/admin";

function requestNetworkIdentity(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "network-unavailable";
}

function profileViewRateKey(request: Request): string {
  const secret = process.env.RATE_LIMIT_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("RATE_LIMIT_NOT_CONFIGURED");
  const rotation = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret)
    .update(`${rotation}:profile-view:${requestNetworkIdentity(request)}`, "utf8")
    .digest("hex");
}

export async function recordPublicProfileView(slug: string, request: Request): Promise<void> {
  const supabase = createPrivilegedClient();
  const { error } = await supabase.rpc("record_public_profile_view", {
    p_profile_slug: slug,
    p_view_key_hash: profileViewRateKey(request),
  });
  if (error) throw new Error(error.message);
}
