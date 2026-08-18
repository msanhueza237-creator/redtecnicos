import { z } from "zod";

export const professionalCategories = ["industrial", "commercial", "residential"] as const;
export type ProfessionalGalleryCategory = (typeof professionalCategories)[number];

export const galleryModerationStates = [
  "declared",
  "pending_review",
  "reviewed",
  "changes_requested",
  "rejected",
  "hidden",
] as const;
export type GalleryModerationState = (typeof galleryModerationStates)[number];

export const galleryItemInputSchema = z.object({
  title: z.string().trim().min(2, "Escribe un título de al menos 2 caracteres.").max(120),
  category: z.enum(professionalCategories),
  description: z.string().trim().min(10, "Describe brevemente el trabajo realizado.").max(600),
});

export const galleryModerationSchema = z.object({
  itemId: z.uuid(),
  decision: z.enum(["approve", "request_changes", "hide"]),
  reason: z.string().trim().min(8, "Escribe un motivo de al menos 8 caracteres.").max(1000),
});

export const galleryAcceptedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_GALLERY_ITEMS = 5;
export const MAX_GALLERY_BATCH_FILES = 5;
export const MAX_PUBLIC_GALLERY_PREVIEW_ITEMS = 3;
export const MAX_GALLERY_UPLOAD_BYTES = 8 * 1024 * 1024;

export interface ProfessionalGalleryItem {
  id: string;
  title: string;
  category: ProfessionalGalleryCategory;
  description: string;
  altText: string;
  displayOrder: number;
  status: GalleryModerationState;
  reviewReason: string | null;
  createdAt: string;
  imageUrl: string;
}

export function nextAvailableGalleryOrder(usedOrders: readonly number[]): number | null {
  const occupied = new Set(usedOrders);
  return Array.from({ length: MAX_GALLERY_ITEMS }, (_, index) => index + 1)
    .find((order) => !occupied.has(order)) ?? null;
}

export function galleryStatusLabel(status: GalleryModerationState): string {
  return {
    declared: "Declarada",
    pending_review: "En revisión",
    reviewed: "Aprobada",
    changes_requested: "Cambios solicitados",
    rejected: "Rechazada",
    hidden: "Oculta",
  }[status];
}

export function galleryStatusClass(status: GalleryModerationState): string {
  if (status === "reviewed") return "is-approved";
  if (status === "changes_requested") return "is-warning";
  if (status === "rejected" || status === "hidden") return "is-danger";
  if (status === "declared") return "is-neutral";
  return "is-pending";
}
