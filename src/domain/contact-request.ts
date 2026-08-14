import { z } from "zod";
import { contactRequestStatusSchema } from "@/domain/directory";

const normalizedRequiredText = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .transform((value) => value.replace(/\s+/g, " "));

const optionalCustomerPhoneSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .min(8)
      .max(24)
      .regex(/^\+?[0-9 ()-]+$/, "El teléfono contiene caracteres no permitidos."),
  ])
  .optional()
  .transform((value) => value || undefined);

export const createContactRequestSchema = z
  .object({
    professionalId: z.string().trim().min(1).max(80),
    professionalSlug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El identificador del perfil no es válido."),
    customerName: normalizedRequiredText(2, 80),
    customerEmail: z.string().trim().toLowerCase().max(254).email(),
    customerPhone: optionalCustomerPhoneSchema,
    commune: normalizedRequiredText(2, 80),
    service: normalizedRequiredText(2, 120),
    description: z.string().trim().min(10).max(1_200),
    consentAccepted: z.literal(true),
  })
  .strict();

export type CreateContactRequestInput = z.infer<typeof createContactRequestSchema>;

export const contactRequestReceiptSchema = z.object({
  requestId: z.string(),
  trackingToken: z.string(),
  status: contactRequestStatusSchema,
  createdAt: z.string().datetime(),
  professional: z.object({
    slug: z.string(),
    displayName: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
});

export type ContactRequestReceipt = z.infer<typeof contactRequestReceiptSchema>;

export const trackingTokenSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{43}$/, "El enlace de seguimiento no es válido.");

export const contactRequestTrackingSchema = z.object({
  requestId: z.string(),
  status: contactRequestStatusSchema,
  createdAt: z.string().datetime(),
  service: z.string(),
  commune: z.string(),
  description: z.string(),
  customerName: z.string(),
  professional: z.object({
    slug: z.string(),
    displayName: z.string(),
  }),
  review: z
    .object({
      id: z.string(),
      status: z.enum(["pending", "published", "rejected", "hidden"]),
      rating: z.number().int().min(1).max(5),
      comment: z.string(),
      wouldRecommend: z.boolean(),
      submittedAt: z.string().datetime(),
    })
    .nullable(),
});

export type ContactRequestTracking = z.infer<typeof contactRequestTrackingSchema>;

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

export interface ApiEnvelope<T, TMeta = Record<string, unknown>> {
  data: T | null;
  error: ApiError | null;
  meta: TMeta | null;
}
