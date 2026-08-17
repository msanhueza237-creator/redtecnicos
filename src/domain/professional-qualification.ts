import { z } from "zod";

export const professionalQualificationTypes = [
  "professional_degree",
  "technical_degree",
  "training",
] as const;

export type ProfessionalQualificationType = (typeof professionalQualificationTypes)[number];

export const qualificationModerationStates = [
  "declared",
  "pending_review",
  "reviewed",
  "changes_requested",
  "rejected",
  "hidden",
] as const;

export type QualificationModerationState = (typeof qualificationModerationStates)[number];

const currentYear = new Date().getFullYear();

export const qualificationSubmissionSchema = z.object({
  type: z.enum(professionalQualificationTypes),
  title: z.string().trim().min(2, "Escribe el nombre del título o capacitación.").max(180),
  institution: z.string().trim().min(2, "Escribe la institución que emitió el documento.").max(180),
  issuedYear: z.preprocess(
    (value) => value === "" || value === null ? undefined : value,
    z.coerce.number().int().min(1950, "Revisa el año de obtención.").max(currentYear, "El año no puede estar en el futuro."),
  ),
  expiresAt: z.preprocess(
    (value) => value === "" || value === null ? null : value,
    z.union([z.null(), z.iso.date("Revisa la fecha de vencimiento.")]),
  ),
});

export const qualificationModerationSchema = z.object({
  qualificationId: z.uuid(),
  decision: z.enum(["approve", "request_changes", "reject"]),
  reason: z.string().trim().min(8, "Escribe un motivo de al menos 8 caracteres.").max(1000),
});

export const qualificationAcceptedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export type QualificationDocumentMime = (typeof qualificationAcceptedMimeTypes)[number];

export const MAX_QUALIFICATIONS = 12;
export const MAX_QUALIFICATION_UPLOAD_BYTES = 10 * 1024 * 1024;

export interface ProfessionalQualificationItem {
  id: string;
  type: ProfessionalQualificationType;
  title: string;
  institution: string;
  issuedYear: number;
  expiresAt: string | null;
  status: QualificationModerationState;
  reviewReason: string | null;
  createdAt: string;
  originalFileName: string;
  fileSizeBytes: number;
  hasDocument: boolean;
  scanStatus: "clean" | "legacy_unverified";
}

export function qualificationTypeLabel(type: ProfessionalQualificationType): string {
  return {
    professional_degree: "Título profesional",
    technical_degree: "Título técnico",
    training: "Capacitación o certificación",
  }[type];
}

export function qualificationStatusLabel(status: QualificationModerationState): string {
  return {
    declared: "Declarada",
    pending_review: "En revisión",
    reviewed: "Aprobada",
    changes_requested: "Cambios solicitados",
    rejected: "Rechazada",
    hidden: "Oculta",
  }[status];
}

export function qualificationStatusClass(status: QualificationModerationState): string {
  if (status === "reviewed") return "is-approved";
  if (status === "changes_requested") return "is-warning";
  if (["rejected", "hidden"].includes(status)) return "is-danger";
  if (status === "declared") return "is-neutral";
  return "is-pending";
}
