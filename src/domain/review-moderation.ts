import { z } from "zod";

export const reviewStatuses = ["pending", "published", "rejected", "hidden"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export const reviewDecisions = ["publish", "reject", "hide"] as const;
export type ReviewDecision = (typeof reviewDecisions)[number];

export const reviewModerationSchema = z.object({
  reviewId: z.uuid(),
  decision: z.enum(reviewDecisions),
  reason: z.string().trim().min(8, "Escribe un motivo de al menos 8 caracteres.").max(1000),
});

export const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: "Pendiente",
  published: "Publicada",
  rejected: "Rechazada",
  hidden: "Oculta",
};

export function availableReviewDecisions(status: ReviewStatus): ReviewDecision[] {
  if (status === "published") return ["hide"];
  if (status === "pending") return ["publish", "reject"];
  if (status === "hidden") return ["publish", "reject"];
  return ["publish"];
}

export function reviewStatusTone(status: ReviewStatus): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "published") return "success";
  if (status === "pending") return "info";
  if (status === "rejected") return "danger";
  if (status === "hidden") return "warning";
  return "neutral";
}
