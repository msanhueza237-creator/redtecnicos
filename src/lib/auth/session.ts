import "server-only";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { getDemoSession, isDemoAuthEnabled } from "@/lib/auth/demo-session";
import {
  isAuthenticatedRole,
  type AuthenticatedRole,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  isSupabaseMode,
} from "@/lib/supabase/config";

export interface AppSession {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  role: AuthenticatedRole;
  source: "demo" | "supabase";
}

export async function getAppSession(): Promise<AppSession | null> {
  if (!isSupabaseMode()) {
    const demo = await getDemoSession();
    return demo
      ? {
          userId: null,
          email: null,
          displayName: null,
          role: demo.role,
          source: "demo",
        }
      : null;
  }

  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") return null;

  const { data: account, error: accountError } = await supabase
    .from("app_users")
    .select("role, display_name, account_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (
    accountError ||
    !account ||
    account.account_status !== "active" ||
    !isAuthenticatedRole(account.role)
  ) {
    return null;
  }

  const emailClaim = claimsData?.claims.email;
  return {
    userId,
    email: typeof emailClaim === "string" ? emailClaim : null,
    displayName:
      typeof account.display_name === "string" ? account.display_name : null,
    role: account.role,
    source: "supabase",
  };
}

function safeRequestedPath(requestedPath: string): string {
  return requestedPath.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/";
}

export async function requireAppRole<const Role extends AuthenticatedRole>(
  allowedRoles: readonly Role[],
  requestedPath: string,
): Promise<AppSession & { role: Role }> {
  const session = await getAppSession();
  if (session && (allowedRoles as readonly AuthenticatedRole[]).includes(session.role)) {
    return session as AppSession & { role: Role };
  }

  const safePath = safeRequestedPath(requestedPath);
  if (!isSupabaseMode() && isDemoAuthEnabled()) {
    const demoEntry = safePath.startsWith("/admin")
      ? "/acceso-demo/administracion"
      : "/acceso-demo";
    redirect(`${demoEntry}?next=${encodeURIComponent(safePath)}` as Route);
  }

  redirect(`/ingresar?next=${encodeURIComponent(safePath)}` as Route);
}
