import { describe, expect, it } from "vitest";
import {
  createDemoSessionToken,
  getDemoEntryPath,
  isDemoRole,
  isRoleAllowed,
  verifyDemoSessionToken,
  type DemoSession,
} from "@/lib/auth/demo-session";

const secret = "a-secret-long-enough-for-demo-session-unit-tests";
const now = Date.UTC(2026, 6, 12, 16, 0, 0);

describe("demo session tokens", () => {
  it("round-trips an allowed role with a bounded expiration", () => {
    const token = createDemoSessionToken("moderator", secret, now, 900);

    expect(verifyDemoSessionToken(token, secret, now)).toEqual({
      version: 1,
      role: "moderator",
      issuedAt: Math.floor(now / 1000),
      expiresAt: Math.floor(now / 1000) + 900,
    });
  });

  it("rejects a token whose payload was changed in the browser", () => {
    const token = createDemoSessionToken("technician", secret, now);
    const [encodedPayload, signature] = token.split(".");
    const payload = JSON.parse(
      Buffer.from(encodedPayload!, "base64url").toString("utf8"),
    ) as DemoSession;
    const elevatedPayload = Buffer.from(
      JSON.stringify({ ...payload, role: "superadmin" }),
      "utf8",
    ).toString("base64url");

    expect(
      verifyDemoSessionToken(`${elevatedPayload}.${signature}`, secret, now),
    ).toBeNull();
  });

  it("rejects expired, future-issued, malformed and oversized tokens", () => {
    const expired = createDemoSessionToken("admin", secret, now, 60);
    const issuedInFuture = createDemoSessionToken("admin", secret, now + 120_000);

    expect(verifyDemoSessionToken(expired, secret, now + 60_000)).toBeNull();
    expect(verifyDemoSessionToken(issuedInFuture, secret, now)).toBeNull();
    expect(verifyDemoSessionToken("not-a-token", secret, now)).toBeNull();
    expect(verifyDemoSessionToken("x".repeat(2049), secret, now)).toBeNull();
  });

  it("does not accept a token signed with another environment secret", () => {
    const token = createDemoSessionToken("admin", secret, now);

    expect(
      verifyDemoSessionToken(
        token,
        "a-different-environment-secret-for-unit-tests",
        now,
      ),
    ).toBeNull();
  });
});

describe("demo role authorization", () => {
  const session: DemoSession = {
    version: 1,
    role: "moderator",
    issuedAt: Math.floor(now / 1000),
    expiresAt: Math.floor(now / 1000) + 900,
  };

  it("recognizes only roles offered by the local demo selector", () => {
    expect(["technician", "moderator", "admin", "superadmin"].every(isDemoRole)).toBe(true);
    expect(["visitor", "customer", "company", "owner", ""].some(isDemoRole)).toBe(false);
  });

  it("allows a session only when its role is in the route allow-list", () => {
    expect(isRoleAllowed(session, ["moderator", "admin", "superadmin"])).toBe(true);
    expect(isRoleAllowed(session, ["admin", "superadmin"])).toBe(false);
    expect(isRoleAllowed(null, ["moderator", "admin", "superadmin"])).toBe(false);
  });

  it("routes administrative guards to the private demo entry", () => {
    expect(getDemoEntryPath("/admin")).toBe("/acceso-demo/administracion");
    expect(getDemoEntryPath("/admin/configuracion")).toBe("/acceso-demo/administracion");
    expect(getDemoEntryPath("/panel")).toBe("/acceso-demo");
    expect(getDemoEntryPath("//admin")).toBe("/acceso-demo");
  });
});
