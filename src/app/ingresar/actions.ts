"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  isAuthenticatedRole,
  roleLandingPath,
} from "@/lib/auth/roles";
import { isSupabaseAuthMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "fullName" | "terms", string[]>>;
}

export const initialAuthActionState: AuthActionState = { status: "idle" };

const loginSchema = z.object({
  email: z.email("Ingresa un correo válido.").trim().toLowerCase(),
  password: z.string().min(1, "Ingresa tu contraseña.").max(128),
  next: z.string().optional(),
});

const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Ingresa tu nombre completo.").max(100),
    email: z.email("Ingresa un correo válido.").trim().toLowerCase(),
    password: z
      .string()
      .min(12, "La contraseña debe tener al menos 12 caracteres.")
      .max(128)
      .regex(/[A-ZÁÉÍÓÚÑ]/u, "Incluye al menos una mayúscula.")
      .regex(/[a-záéíóúñ]/u, "Incluye al menos una minúscula.")
      .regex(/[0-9]/, "Incluye al menos un número."),
    confirmPassword: z.string(),
    kind: z.enum(["technician", "company"]),
    terms: z.literal("on", { error: "Debes aceptar los términos para continuar." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["password"],
    message: "Las contraseñas no coinciden.",
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

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    kind: formData.get("kind"),
    terms: formData.get("terms"),
  });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Revisa los datos antes de crear la cuenta.",
      fieldErrors: {
        fullName: errors.fullName,
        email: errors.email,
        password: errors.password,
        terms: errors.terms,
      },
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
        consent_version: "professional-terms-v1",
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
