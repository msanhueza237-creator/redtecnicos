import { z } from "zod";
import { reviewStatusSchema } from "@/domain/directory";
import { trackingTokenSchema } from "@/domain/contact-request";

const normalizedCommentSchema = z
  .string()
  .trim()
  .min(10, "Cuéntanos brevemente cómo fue el trabajo.")
  .max(600, "El comentario no puede superar los 600 caracteres.")
  .transform((value) => value.replace(/\s+/g, " "));

export const createReviewSchema = z
  .object({
    trackingToken: trackingTokenSchema,
    rating: z.number().int().min(1).max(5),
    comment: normalizedCommentSchema,
    wouldRecommend: z.boolean(),
    customerDeclaration: z.literal(true),
  })
  .strict();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const reviewReceiptSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  status: reviewStatusSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  wouldRecommend: z.boolean(),
  submittedAt: z.string().datetime(),
  professional: z.object({
    slug: z.string(),
    displayName: z.string(),
  }),
});

export type ReviewReceipt = z.infer<typeof reviewReceiptSchema>;
