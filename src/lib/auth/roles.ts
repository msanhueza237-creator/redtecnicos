import type { Route } from "next";
import type { UserRole } from "@/domain/directory";

export const AUTHENTICATED_ROLES = [
  "technician",
  "company",
  "moderator",
  "admin",
  "superadmin",
] as const;

export type AuthenticatedRole = Extract<
  UserRole,
  (typeof AUTHENTICATED_ROLES)[number]
>;

export const ADMIN_ROLES = ["moderator", "admin", "superadmin"] as const;
export type AdminRole = Extract<AuthenticatedRole, (typeof ADMIN_ROLES)[number]>;

export function isAuthenticatedRole(value: unknown): value is AuthenticatedRole {
  return (
    typeof value === "string" &&
    (AUTHENTICATED_ROLES as readonly string[]).includes(value)
  );
}

export function isAdminRole(value: UserRole | null): value is AdminRole {
  return value !== null && (ADMIN_ROLES as readonly string[]).includes(value);
}

export function roleLandingPath(role: AuthenticatedRole): Route {
  return isAdminRole(role) ? "/admin" : "/panel";
}
