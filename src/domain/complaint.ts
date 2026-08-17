import { z } from "zod";

export const complaintCategories = [
  "profile_information",
  "contact_request",
  "review",
  "professional_conduct",
  "privacy",
  "other",
] as const;

export const complaintRelatedTypes = [
  "profile",
  "contact_request",
  "review",
  "general",
] as const;

export const complaintStatuses = [
  "new",
  "triaged",
  "investigating",
  "awaiting_information",
  "resolved",
  "dismissed",
] as const;

export const complaintPriorities = ["low", "medium", "high", "urgent"] as const;

export type ComplaintCategory = (typeof complaintCategories)[number];
export type ComplaintRelatedType = (typeof complaintRelatedTypes)[number];
export type ComplaintStatus = (typeof complaintStatuses)[number];
export type ComplaintPriority = (typeof complaintPriorities)[number];

export const complaintCategoryLabels: Record<ComplaintCategory, string> = {
  profile_information: "Información incorrecta en un perfil",
  contact_request: "Problema con una solicitud de contacto",
  review: "Problema con una evaluación",
  professional_conduct: "Conducta o servicio del profesional",
  privacy: "Privacidad o uso de datos personales",
  other: "Otro motivo",
};

export const complaintRelatedTypeLabels: Record<ComplaintRelatedType, string> = {
  profile: "Perfil profesional",
  contact_request: "Solicitud de contacto",
  review: "Evaluación",
  general: "Sin recurso específico",
};

export const complaintStatusLabels: Record<ComplaintStatus, string> = {
  new: "Nuevo",
  triaged: "Clasificado",
  investigating: "En investigación",
  awaiting_information: "Esperando antecedentes",
  resolved: "Resuelto",
  dismissed: "Desestimado",
};

export const complaintPriorityLabels: Record<ComplaintPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

const optionalPhoneSchema = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(8, "Ingresa un teléfono válido.").max(24).optional(),
);

const optionalReferenceSchema = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(160).optional(),
);

export const createComplaintSchema = z.object({
  reporterName: z.string().trim().min(2, "Ingresa tu nombre.").max(100),
  reporterEmail: z.string().trim().toLowerCase().max(254).email("Ingresa un correo válido."),
  reporterPhone: optionalPhoneSchema,
  category: z.enum(complaintCategories, { error: "Selecciona el motivo del reporte." }),
  subject: z.string().trim().min(5, "Resume el problema en al menos 5 caracteres.").max(160),
  description: z.string().trim().min(30, "Describe lo ocurrido en al menos 30 caracteres.").max(3000),
  relatedType: z.enum(complaintRelatedTypes),
  relatedReference: optionalReferenceSchema,
  consentAccepted: z.literal(true, { error: "Debes aceptar el tratamiento de datos para enviar el reporte." }),
  website: z.literal("").default(""),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

export interface ComplaintReceipt {
  caseNumber: string;
  status: ComplaintStatus;
  createdAt: string;
}

export const complaintAdminUpdateSchema = z
  .object({
    complaintId: z.uuid(),
    status: z.enum(complaintStatuses),
    priority: z.enum(complaintPriorities),
    reason: z.string().trim().min(8, "Escribe un motivo de al menos 8 caracteres.").max(1000),
    resolutionSummary: z.string().trim().max(1500),
  })
  .superRefine((data, context) => {
    if (["resolved", "dismissed"].includes(data.status) && data.resolutionSummary.length < 10) {
      context.addIssue({
        code: "custom",
        path: ["resolutionSummary"],
        message: "Escribe un resumen de resolución de al menos 10 caracteres.",
      });
    }
  });
