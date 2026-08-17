import { z } from "zod";
import { isCommuneInRegion } from "@/data/chile-communes";

export const professionalServices = [
  "Instalación de aire acondicionado",
  "Mantención de aire acondicionado",
  "Reparación de aire acondicionado",
  "Limpieza de equipos",
  "Diagnóstico técnico",
  "Refrigeración comercial",
  "Cámaras de frío",
  "Electricidad relacionada",
  "Instalación de bombas de condensado",
  "Instalación de tuberías de cobre",
  "Detección de fugas",
  "Carga de refrigerante",
] as const;

export const professionalModalities = [
  "Atención a domicilio",
  "Atención en taller",
  "Diagnóstico remoto inicial",
] as const;

export const chileRegionOptions = [
  { code: "CL-AP", name: "Arica y Parinacota" },
  { code: "CL-TA", name: "Tarapacá" },
  { code: "CL-AN", name: "Antofagasta" },
  { code: "CL-AT", name: "Atacama" },
  { code: "CL-CO", name: "Coquimbo" },
  { code: "CL-VS", name: "Valparaíso" },
  { code: "CL-RM", name: "Metropolitana de Santiago" },
  { code: "CL-LI", name: "Libertador General Bernardo O'Higgins" },
  { code: "CL-ML", name: "Maule" },
  { code: "CL-NB", name: "Ñuble" },
  { code: "CL-BI", name: "Biobío" },
  { code: "CL-AR", name: "La Araucanía" },
  { code: "CL-LR", name: "Los Ríos" },
  { code: "CL-LL", name: "Los Lagos" },
  { code: "CL-AI", name: "Aysén del General Carlos Ibáñez del Campo" },
  { code: "CL-MA", name: "Magallanes y de la Antártica Chilena" },
] as const;

export const professionalRegistrationSchema = z
  .object({
    fullName: z.string().trim().min(3, "Ingresa tu nombre completo.").max(100),
    email: z.email("Ingresa un correo válido.").trim().toLowerCase(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?56\s?9\s?\d{4}\s?\d{4}$/u, "Ingresa un celular chileno, por ejemplo +56 9 1234 5678."),
    password: z
      .string()
      .min(12, "La contraseña debe tener al menos 12 caracteres.")
      .max(128)
      .regex(/[A-ZÁÉÍÓÚÑ]/u, "Incluye al menos una mayúscula.")
      .regex(/[a-záéíóúñ]/u, "Incluye al menos una minúscula.")
      .regex(/[0-9]/u, "Incluye al menos un número."),
    confirmPassword: z.string(),
    kind: z.enum(["technician", "company"]),
    displayName: z.string().trim().min(2, "Ingresa el nombre que verá el público.").max(100),
    category: z.enum(["industrial", "commercial", "residential"], {
      error: "Selecciona una categoría principal.",
    }),
    yearsExperience: z.coerce.number().int().min(0).max(70),
    summary: z
      .string()
      .trim()
      .min(40, "La presentación debe tener al menos 40 caracteres.")
      .max(600, "La presentación no puede superar 600 caracteres."),
    services: z.array(z.enum(professionalServices)).min(1, "Selecciona al menos un servicio.").max(6, "Selecciona hasta seis servicios."),
    regionCode: z.enum(chileRegionOptions.map((region) => region.code) as [string, ...string[]], {
      error: "Selecciona una región.",
    }),
    commune: z.string().trim().min(2, "Ingresa tu comuna principal.").max(100),
    modalities: z.array(z.enum(professionalModalities)).min(1, "Selecciona al menos una modalidad."),
    hasVehicle: z.boolean(),
    terms: z.literal("on", { error: "Debes aceptar los términos para continuar." }),
  })
  .superRefine((data, context) => {
    if (!isCommuneInRegion(data.regionCode, data.commune)) {
      context.addIssue({
        code: "custom",
        path: ["commune"],
        message: "Selecciona una comuna válida de la región.",
      });
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["password"],
    message: "Las contraseñas no coinciden.",
  });

export type ProfessionalRegistration = z.infer<typeof professionalRegistrationSchema>;

export function regionNameFromCode(code: string): string {
  return chileRegionOptions.find((region) => region.code === code)?.name ?? code;
}
