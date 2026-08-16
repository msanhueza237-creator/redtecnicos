"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  isAuthenticatedRole,
  roleLandingPath,
} from "@/lib/auth/roles";
import type { AuthActionState } from "@/lib/auth/action-state";
import { professionalRegistrationSchema } from "@/domain/professional-registration";
import { isSupabaseAuthMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email("Ingresa un correo válido.").trim().toLowerCase(),
  password: z.string().min(1, "Ingresa tu contraseña.").max(128),
  next: z.string().optional(),
});

function authUnavailable(): AuthActionState {
  return {
    status: "error",
    message: "El acceso real aún no está habilitado en este entorno.",
  };
}

function safeDestination(value: string | undefined, fallback: Route): Route {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value as Route;
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseAuthMode()) return authUnavailable();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (signInError) {
    return {
      status: "error",
      message: "Correo o contraseña incorrectos, o cuenta pendiente de confirmación.",
    };
  }

  const { data: account, error: accountError } = await supabase
    .from("app_users")
    .select("role, account_status")
    .eq("user_id", signInData.user.id)
    .maybeSingle();

  if (
    accountError ||
    !account ||
    account.account_status !== "active" ||
    !isAuthenticatedRole(account.role)
  ) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "La cuenta no tiene un acceso activo. Contacta a la administración.",
    };
  }

  redirect(safeDestination(parsed.data.next, roleLandingPath(account.role)));
}

export async function registerProfessionalAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseAuthMode()) return authUnavailable();

  const parsed = professionalRegistrationSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    kind: formData.get("kind"),
    displayName: formData.get("displayName"),
    category: formData.get("category"),
    yearsExperience: formData.get("yearsExperience"),
    summary: formData.get("summary"),
    services: formData.getAll("services"),
    regionCode: formData.get("regionCode"),
    commune: formData.get("commune"),
    modalities: formData.getAll("modalities"),
    hasVehicle: formData.get("hasVehicle") === "on",
    terms: formData.get("terms"),
  });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Revisa los datos antes de crear la cuenta.",
      fieldErrors: errors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.fullName,
        entity_kind: parsed.data.kind,
        phone: parsed.data.phone,
        professional_display_name: parsed.data.displayName,
        professional_category: parsed.data.category,
        years_experience: parsed.data.yearsExperience,
        summary: parsed.data.summary,
        services: parsed.data.services,
        region_code: parsed.data.regionCode,
        commune_codes: [parsed.data.commune],
        modalities: parsed.data.modalities,
        has_vehicle: parsed.data.hasVehicle,
        consent_version: "professional-terms-v1",
        registration_version: "professional-onboarding-v1",
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message:
        error.status === 429
          ? "Se alcanzó el límite de intentos. Espera unos minutos."
          : "No fue posible crear la cuenta. Si el correo ya existe, utiliza Ingresar.",
    };
  }

  if (data.session) redirect("/panel" as Route);
  redirect("/ingresar?registro=confirmar-correo" as Route);
}
