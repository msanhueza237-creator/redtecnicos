import { z } from "zod";

export const professionalKindSchema = z.enum(["technician", "company"]);
export type ProfessionalKind = z.infer<typeof professionalKindSchema>;

export const professionalCategorySchema = z.enum(["industrial", "commercial", "residential"]);
export type ProfessionalCategory = z.infer<typeof professionalCategorySchema>;

export const qualificationTypeSchema = z.enum([
  "professional_degree",
  "technical_degree",
  "training",
]);
export type QualificationType = z.infer<typeof qualificationTypeSchema>;

export const qualificationStatusSchema = z.enum([
  "declared",
  "pending_review",
  "reviewed",
  "changes_requested",
  "rejected",
]);
export type QualificationStatus = z.infer<typeof qualificationStatusSchema>;

export const profileStatusSchema = z.enum([
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "verified",
  "suspended",
  "rejected",
  "deleted",
  "expired_documents",
]);
export type ProfileStatus = z.infer<typeof profileStatusSchema>;

export const userRoleSchema = z.enum([
  "visitor",
  "customer",
  "technician",
  "company",
  "moderator",
  "admin",
  "superadmin",
]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const contactRequestStatusSchema = z.enum([
  "new",
  "viewed",
  "contacted",
  "accepted",
  "rejected",
  "completed",
  "cancelled",
  "expired",
]);
export type ContactRequestStatus = z.infer<typeof contactRequestStatusSchema>;

export const reviewStatusSchema = z.enum(["pending", "published", "rejected", "hidden"]);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

export type VerificationBadge =
  | "Identidad revisada"
  | "Correo confirmado"
  | "Teléfono confirmado"
  | "Formación revisada"
  | "Perfil completo"
  | "Fotografías aprobadas";

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageSrc: string;
  alt: string;
  status: "approved" | "pending_review" | "changes_requested" | "hidden";
}

export interface Qualification {
  id: string;
  type: QualificationType;
  title: string;
  institution: string;
  issuedYear: number;
  expiresAt?: string;
  status: QualificationStatus;
  reviewedAt: string;
}

export interface Professional {
  id: string;
  slug: string;
  kind: ProfessionalKind;
  displayName: string;
  initials: string;
  categories: ProfessionalCategory[];
  headline: string;
  summary: string;
  region: string;
  communes: string[];
  services: string[];
  specialties: string[];
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  score: number;
  availability: "Disponible esta semana" | "Agenda limitada" | "Solo emergencias";
  responseTime: string;
  modalities: Array<"Domiciliaria" | "Comercial" | "Taller" | "Diagnóstico remoto inicial">;
  vehicle: boolean;
  badges: VerificationBadge[];
  qualifications: Qualification[];
  portfolio: PortfolioItem[];
  status: Extract<ProfileStatus, "approved" | "verified">;
  isDemo: boolean;
}

export const directoryFiltersSchema = z.object({
  query: z.string().trim().max(80).default(""),
  region: z.string().trim().max(80).default(""),
  commune: z.string().trim().max(80).default(""),
  service: z.string().trim().max(120).default(""),
  category: z.union([professionalCategorySchema, z.literal("")]).default(""),
  kind: z.union([professionalKindSchema, z.literal("")]).default(""),
  verifiedOnly: z.boolean().default(false),
  certifiedOnly: z.boolean().default(false),
  vehicleOnly: z.boolean().default(false),
  availability: z.union([
    z.literal(""),
    z.literal("Disponible esta semana"),
    z.literal("Agenda limitada"),
    z.literal("Solo emergencias"),
  ]).default(""),
  modality: z.union([
    z.literal(""),
    z.literal("Domiciliaria"),
    z.literal("Comercial"),
    z.literal("Taller"),
    z.literal("Diagnóstico remoto inicial"),
  ]).default(""),
  minimumExperience: z.number().int().min(0).max(60).default(0),
  minimumRating: z.number().min(0).max(5).default(0),
  sort: z.enum(["relevance", "score", "rating", "reviews"]).default("relevance"),
});

export type DirectoryFilters = z.infer<typeof directoryFiltersSchema>;

export const defaultDirectoryFilters: DirectoryFilters = directoryFiltersSchema.parse({});

export function projectPublicProfessional(professional: Professional): Professional {
  return {
    ...professional,
    qualifications: professional.qualifications.filter((qualification) => qualification.status === "reviewed"),
    portfolio: professional.portfolio.filter((item) => item.status === "approved").slice(0, 3),
  };
}

export function filterProfessionals(
  professionals: readonly Professional[],
  filtersInput: Partial<DirectoryFilters>,
  enableDemoProfiles = true,
): Professional[] {
  const filters = directoryFiltersSchema.parse(filtersInput);
  const normalizedQuery = filters.query.toLocaleLowerCase("es-CL");

  const filtered = professionals.filter((professional) => {
    if (professional.isDemo && !enableDemoProfiles) return false;
    if (filters.region && professional.region !== filters.region) return false;
    if (filters.commune && !professional.communes.includes(filters.commune)) return false;
    if (filters.service && !professional.services.includes(filters.service)) return false;
    if (filters.kind && professional.kind !== filters.kind) return false;
    if (filters.category && !professional.categories.includes(filters.category)) return false;
    if (filters.verifiedOnly && professional.status !== "verified") return false;
    if (filters.certifiedOnly && !professional.qualifications.some((qualification) => qualification.status === "reviewed")) return false;
    if (filters.vehicleOnly && !professional.vehicle) return false;
    if (filters.availability && professional.availability !== filters.availability) return false;
    if (filters.modality && !professional.modalities.includes(filters.modality)) return false;
    if (professional.yearsExperience < filters.minimumExperience) return false;
    if (professional.rating < filters.minimumRating) return false;

    if (normalizedQuery) {
      const searchable = [
        professional.displayName,
        professional.headline,
        professional.region,
        ...professional.categories,
        ...professional.communes,
        ...professional.services,
        ...professional.specialties,
        ...professional.qualifications.filter((qualification) => qualification.status === "reviewed").map((qualification) => qualification.title),
      ]
        .join(" ")
        .toLocaleLowerCase("es-CL");
      if (!searchable.includes(normalizedQuery)) return false;
    }

    return true;
  });

  return [...filtered].sort((left, right) => {
    switch (filters.sort) {
      case "score":
        return right.score - left.score || left.displayName.localeCompare(right.displayName, "es-CL");
      case "rating":
        return right.rating - left.rating || right.reviewCount - left.reviewCount;
      case "reviews":
        return right.reviewCount - left.reviewCount || right.rating - left.rating;
      default:
        return right.score + right.rating * 4 - (left.score + left.rating * 4);
    }
  });
}
