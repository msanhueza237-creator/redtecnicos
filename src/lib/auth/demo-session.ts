import { createHmac, timingSafeEqual } from "node:crypto";
import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/domain/directory";
import { getAuthDataSource } from "@/lib/supabase/config";

export const DEMO_SESSION_COOKIE = "red_tecnicos_demo_session";
export const DEMO_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export const DEMO_ROLES = ["technician", "moderator", "admin", "superadmin"] as const;
export type DemoRole = Extract<UserRole, (typeof DEMO_ROLES)[number]>;

export interface DemoSession {
  version: 1;
  role: DemoRole;
  issuedAt: number;
  expiresAt: number;
}

const LOCAL_FIXTURES_SECRET =
  "red-tecnicos-fixtures-only-local-development-secret-v1";

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signEncodedPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function isDemoSession(value: unknown): value is DemoSession {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<DemoSession>;
  return (
    candidate.version === 1 &&
    isDemoRole(candidate.role) &&
    Number.isInteger(candidate.issuedAt) &&
    Number.isInteger(candidate.expiresAt) &&
    (candidate.issuedAt ?? 0) > 0 &&
    (candidate.expiresAt ?? 0) > (candidate.issuedAt ?? 0)
  );
}

function validateSecret(secret: string): void {
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("DEMO_AUTH_SECRET debe contener al menos 32 bytes.");
  }
}

export function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === "string" && (DEMO_ROLES as readonly string[]).includes(value);
}

export function isDemoAuthEnabled(): boolean {
  return (
    process.env.APP_DATA_SOURCE === "fixtures" &&
    getAuthDataSource() === "fixtures" &&
    process.env.DEMO_AUTH_ENABLED !== "false"
  );
}

export function getDemoAuthSecret(): string {
  const configuredSecret = process.env.DEMO_AUTH_SECRET?.trim();

  if (configuredSecret) {
    validateSecret(configuredSecret);
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DEMO_AUTH_SECRET es obligatorio en producción cuando APP_DATA_SOURCE=fixtures.",
    );
  }

  return LOCAL_FIXTURES_SECRET;
}

/**
 * Crea un token autocontenido para la sesión demo. La información no es secreta,
 * pero la firma impide que el navegador pueda elevar su propio rol.
 */
export function createDemoSessionToken(
  role: DemoRole,
  secret: string,
  nowMilliseconds = Date.now(),
  maxAgeSeconds = DEMO_SESSION_MAX_AGE_SECONDS,
): string {
  validateSecret(secret);

  const issuedAt = Math.floor(nowMilliseconds / 1000);
  const payload: DemoSession = {
    version: 1,
    role,
    issuedAt,
    expiresAt: issuedAt + maxAgeSeconds,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${signEncodedPayload(encodedPayload, secret)}`;
}

export function verifyDemoSessionToken(
  token: string,
  secret: string,
  nowMilliseconds = Date.now(),
): DemoSession | null {
  validateSecret(secret);

  if (token.length > 2048) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, suppliedSignature] = parts;
  if (!encodedPayload || !suppliedSignature) return null;

  const expectedSignature = signEncodedPayload(encodedPayload, secret);
  const suppliedBuffer = Buffer.from(suppliedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const session: unknown = JSON.parse(decoded);
    if (!isDemoSession(session)) return null;

    const now = Math.floor(nowMilliseconds / 1000);
    if (session.expiresAt <= now || session.issuedAt > now + 60) return null;

    return session;
  } catch {
    return null;
  }
}

export async function setDemoSession(role: DemoRole): Promise<DemoSession> {
  if (!isDemoAuthEnabled()) {
    throw new Error("El acceso demo solo está disponible con APP_DATA_SOURCE=fixtures.");
  }

  const now = Date.now();
  const secret = getDemoAuthSecret();
  const token = createDemoSessionToken(role, secret, now);
  const session = verifyDemoSessionToken(token, secret, now);
  if (!session) throw new Error("No fue posible crear la sesión demo.");

  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEMO_SESSION_MAX_AGE_SECONDS,
  });

  return session;
}

export async function getDemoSession(): Promise<DemoSession | null> {
  if (!isDemoAuthEnabled()) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  if (!token) return null;

  return verifyDemoSessionToken(token, getDemoAuthSecret());
}

export async function clearDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function isRoleAllowed(
  session: DemoSession | null,
  allowedRoles: readonly DemoRole[],
): session is DemoSession {
  return session !== null && allowedRoles.includes(session.role);
}

export function getDemoEntryPath(
  requestedPath: string,
): "/acceso-demo" | "/acceso-demo/administracion" {
  return requestedPath === "/admin" || requestedPath.startsWith("/admin/")
    ? "/acceso-demo/administracion"
    : "/acceso-demo";
}

export async function requireDemoRole(
  allowedRoles: readonly DemoRole[],
  requestedPath: string,
): Promise<DemoSession> {
  const session = await getDemoSession();
  if (isRoleAllowed(session, allowedRoles)) return session;

  const safePath = requestedPath.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/";
  const entryPath = getDemoEntryPath(safePath);
  redirect(`${entryPath}?next=${encodeURIComponent(safePath)}` as Route);
}
