import { describe, expect, it } from "vitest";
import {
  isAdminRole,
  isAuthenticatedRole,
  roleLandingPath,
} from "@/lib/auth/roles";

describe("autorización por roles", () => {
  it("solo reconoce roles que pueden iniciar sesión", () => {
    expect(isAuthenticatedRole("technician")).toBe(true);
    expect(isAuthenticatedRole("company")).toBe(true);
    expect(isAuthenticatedRole("superadmin")).toBe(true);
    expect(isAuthenticatedRole("visitor")).toBe(false);
    expect(isAuthenticatedRole("customer")).toBe(false);
    expect(isAuthenticatedRole("admin-inventado")).toBe(false);
  });

  it("limita el centro administrativo a sus tres roles", () => {
    expect(isAdminRole("moderator")).toBe(true);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("superadmin")).toBe(true);
    expect(isAdminRole("technician")).toBe(false);
    expect(isAdminRole("company")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
  });

  it("dirige cada rol al área correcta", () => {
    expect(roleLandingPath("technician")).toBe("/panel");
    expect(roleLandingPath("company")).toBe("/panel");
    expect(roleLandingPath("moderator")).toBe("/admin");
    expect(roleLandingPath("admin")).toBe("/admin");
    expect(roleLandingPath("superadmin")).toBe("/admin");
  });
});
