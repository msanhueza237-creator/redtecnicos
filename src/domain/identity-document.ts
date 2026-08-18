import { z } from "zod";
import type { QualificationModerationState } from "@/domain/professional-qualification";

export const identityDocumentTypes = ["identity_document", "company_tax_document"] as const;
export type IdentityDocumentType = (typeof identityDocumentTypes)[number];

export const identityDocumentSubmissionSchema = z.object({
  documentType: z.enum(identityDocumentTypes),
  subjectName: z.string().trim().min(3, "Escribe el nombre completo o razón social.").max(160),
});

export const identityDocumentModerationSchema = z.object({
  documentId: z.uuid(),
  decision: z.enum(["approve", "request_changes", "reject"]),
  reason: z.string().trim().min(8, "Escribe un motivo de al menos 8 caracteres.").max(1000),
});

export const MAX_IDENTITY_DOCUMENTS = 3;

export interface IdentityDocumentItem {
  id: string;
  documentType: IdentityDocumentType;
  subjectName: string;
  status: QualificationModerationState;
  reviewReason: string | null;
  originalFileName: string;
  fileSizeBytes: number;
  hasDocument: boolean;
  scanStatus: "clean";
  createdAt: string;
}

export function identityDocumentTypeLabel(type: IdentityDocumentType): string {
  return type === "company_tax_document" ? "Documento tributario de empresa" : "Documento de identidad";
}
