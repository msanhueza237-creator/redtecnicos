"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import {
  clearDemoSession,
  isDemoAuthEnabled,
  setDemoSession,
  type DemoRole,
} from "@/lib/auth/demo-session";

function defaultDestination(role: DemoRole): Route {
  return role === "technician" ? "/panel" : "/admin";
}

function entryDestination(role: DemoRole): string {
  return role === "technician" ? "/acceso-demo" : "/acceso-demo/administracion";
}

function safeDestination(value: FormDataEntryValue | null, role: DemoRole): Route {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return defaultDestination(role);
  }

  const permittedPrefix = role === "technician" ? "/panel" : "/admin";
  return value === permittedPrefix || value.startsWith(`${permittedPrefix}/`)
    ? value as Route
    : defaultDestination(role);
}

async function enterDemoRole(role: DemoRole, formData: FormData): Promise<never> {
  if (!isDemoAuthEnabled()) {
    redirect(`${entryDestination(role)}?error=disabled` as Route);
  }

  await setDemoSession(role);
  redirect(safeDestination(formData.get("next"), role));
}

export async function enterTechnicianDemoAction(formData: FormData): Promise<never> {
  return enterDemoRole("technician", formData);
}

export async function enterAdminDemoAction(formData: FormData): Promise<never> {
  return enterDemoRole("admin", formData);
}

export async function leaveDemoAction(): Promise<never> {
  await clearDemoSession();
  redirect("/acceso-demo?logout=1" as Route);
}
