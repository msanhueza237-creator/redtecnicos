import { z } from "zod";
import {
  isValidChileanMobile,
  normalizeChileanMobile,
  professionalServices,
} from "@/domain/professional-registration";

export const profileAvailabilityOptions = [
  "Disponible esta semana",
  "Agenda limitada",
  "Solo emergencias",
  "No disponible temporalmente",
] as const;

export const paymentMethodOptions = [
  "Transferencia",
  "Tarjeta",
  "Efectivo",
  "Link de pago",
] as const;

const optionalListItem = z.string().trim().min(2).max(80);

export const professionalMainProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Ingresa un nombre público.").max(100),
  headline: z.string().trim().min(5, "Describe brevemente tu especialidad.").max(160),
  summary: z.string().trim().min(40, "La presentación debe tener al menos 40 caracteres.").max(1600),
  categories: z.array(z.enum(["industrial", "commercial", "residential"])).min(1, "Selecciona al menos una categoría.").max(3),
  yearsExperience: z.coerce.number().int().min(0).max(70),
  publicEmail: z.email("Ingresa un correo de contacto válido.").trim().toLowerCase(),
  publicPhone: z.string().trim().transform(normalizeChileanMobile).refine(isValidChileanMobile, "Ingresa un celular chileno válido."),
  whatsappPhone: z.string().trim().transform(normalizeChileanMobile).refine(isValidChileanMobile, "Ingresa un WhatsApp chileno válido."),
});

export const professionalServicesProfileSchema = z.object({
  services: z.array(z.enum(professionalServices)).min(1, "Selecciona al menos un servicio.").max(6, "Selecciona hasta seis servicios."),
  specialties: z.array(optionalListItem).max(12),
  brands: z.array(optionalListItem).max(12),
  equipmentTypes: z.array(optionalListItem).max(12),
});

export const professionalPreferencesSchema = z.object({
  availability: z.enum(profileAvailabilityOptions),
  workingHours: z.string().trim().max(180, "El horario no puede superar 180 caracteres."),
  emergencyAvailable: z.boolean(),
  acceptsNewRequests: z.boolean(),
  issuesInvoice: z.boolean(),
  issuesReceipt: z.boolean(),
  writtenQuotes: z.boolean(),
  declaredWarranty: z.string().trim().max(240, "La información de garantía no puede superar 240 caracteres."),
  paymentMethods: z.array(z.enum(paymentMethodOptions)).max(4),
});

export const professionalReviewReplySchema = z.object({
  reviewId: z.uuid(),
  reply: z.string().trim().min(2, "Escribe una respuesta de al menos 2 caracteres.").max(800),
});

export const profileAvatarAcceptedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_PROFILE_AVATAR_BYTES = 5 * 1024 * 1024;

export interface ProfessionalPanelActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export const initialProfessionalPanelActionState: ProfessionalPanelActionState = {
  status: "idle",
  message: "",
};

export function splitOptionalList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(/[,;\n]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}
