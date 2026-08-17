import { z } from "zod";

export const siteContentSlotKeys = [
  "home_directory_notice",
  "home_professional_cta",
] as const;

export const siteContentSlotSchema = z.enum(siteContentSlotKeys);
export type SiteContentSlot = z.infer<typeof siteContentSlotSchema>;

export const siteContentHrefValues = [
  "/tecnicos",
  "/registro-tecnico",
  "/registro-empresa",
  "/como-funciona",
  "/preguntas-frecuentes",
  "/reportar",
] as const;

export const siteContentHrefSchema = z.enum(siteContentHrefValues);

export const siteContentValueSchema = z.object({
  enabled: z.boolean(),
  eyebrow: z.string().trim().min(3, "Escribe una etiqueta de al menos 3 caracteres.").max(60),
  title: z.string().trim().min(8, "El título debe tener al menos 8 caracteres.").max(120),
  body: z.string().trim().min(20, "El texto debe tener al menos 20 caracteres.").max(500),
  primaryCtaLabel: z.string().trim().min(3, "Escribe el texto del botón principal.").max(60),
  primaryCtaHref: siteContentHrefSchema,
  secondaryCtaLabel: z.string().trim().max(60),
  secondaryCtaHref: z.union([siteContentHrefSchema, z.literal("")]),
}).superRefine((value, context) => {
  const hasLabel = value.secondaryCtaLabel.length > 0;
  const hasHref = value.secondaryCtaHref.length > 0;
  if (hasLabel !== hasHref) {
    context.addIssue({
      code: "custom",
      message: "Completa tanto el texto como el destino del botón secundario, o deja ambos vacíos.",
      path: hasLabel ? ["secondaryCtaHref"] : ["secondaryCtaLabel"],
    });
  }
});

export type SiteContentValue = z.infer<typeof siteContentValueSchema>;

export const siteContentEditorSchema = siteContentValueSchema.and(z.object({
  slot: siteContentSlotSchema,
  expectedRevision: z.coerce.number().int().positive(),
  reason: z.string().trim().min(8, "Explica el motivo del cambio en al menos 8 caracteres.").max(500),
}));

export const siteContentPublishSchema = z.object({
  slot: siteContentSlotSchema,
  expectedRevision: z.coerce.number().int().positive(),
  reason: z.string().trim().min(8, "Explica el motivo de la publicación en al menos 8 caracteres.").max(500),
});

export interface PublicSiteContentEntry {
  slot: SiteContentSlot;
  content: SiteContentValue;
  version: number;
  publishedAt: string;
}

export interface AdminSiteContentEntry {
  slot: SiteContentSlot;
  label: string;
  description: string;
  draft: SiteContentValue;
  published: SiteContentValue;
  revision: number;
  publishedRevision: number;
  publishedVersion: number;
  updatedAt: string;
  publishedAt: string;
}

export const defaultSiteContent: Record<SiteContentSlot, SiteContentValue> = {
  home_directory_notice: {
    enabled: true,
    eyebrow: "Directorio informativo",
    title: "Decide con información antes de contratar",
    body: "Compara cobertura, experiencia, formación revisada y evaluaciones verificadas. El presupuesto, pago, ejecución y garantía se acuerdan directamente con cada profesional.",
    primaryCtaLabel: "Explorar el directorio",
    primaryCtaHref: "/tecnicos",
    secondaryCtaLabel: "Cómo funciona",
    secondaryCtaHref: "/como-funciona",
  },
  home_professional_cta: {
    enabled: true,
    eyebrow: "Para técnicos y empresas",
    title: "Haz visible tu experiencia en refrigeración y climatización",
    body: "Publica servicios, cobertura, formación revisada y trabajos realizados. Tú mantienes el control de tu información.",
    primaryCtaLabel: "Registrarme como técnico",
    primaryCtaHref: "/registro-tecnico",
    secondaryCtaLabel: "Registrar una empresa",
    secondaryCtaHref: "/registro-empresa",
  },
};

export function siteContentFromFormData(formData: FormData) {
  return {
    slot: formData.get("slot"),
    expectedRevision: formData.get("expectedRevision"),
    enabled: formData.get("enabled") === "on",
    eyebrow: formData.get("eyebrow"),
    title: formData.get("title"),
    body: formData.get("body"),
    primaryCtaLabel: formData.get("primaryCtaLabel"),
    primaryCtaHref: formData.get("primaryCtaHref"),
    secondaryCtaLabel: formData.get("secondaryCtaLabel") ?? "",
    secondaryCtaHref: formData.get("secondaryCtaHref") ?? "",
    reason: formData.get("reason"),
  };
}
