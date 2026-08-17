import "server-only";

import { demoProfessionals, getProfessionalBySlug } from "@/data/demo-professionals";
import type {
  PortfolioItem,
  Professional,
  ProfessionalCategory,
  ProfessionalKind,
  Qualification,
  VerificationBadge,
} from "@/domain/directory";
import { regionNameFromCode } from "@/domain/professional-registration";
import { isSupabaseMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface DirectoryRow {
  profile_id: string;
  slug: string;
  kind: ProfessionalKind;
  display_name: string;
  headline: string;
  summary: string;
  categories: ProfessionalCategory[];
  region_code: string;
  commune_codes: string[];
  services: string[];
  specialties: string[];
  years_experience: number;
  modalities: string[];
  has_vehicle: boolean;
  availability: string | null;
  score: number;
  rating: number | string;
  review_count: number;
  badges: string[];
  qualifications: unknown;
  portfolio: unknown;
  is_verified: boolean;
  is_demo: boolean;
}

interface StoredQualification {
  type?: string;
  title?: string;
  institution?: string;
  issuedYear?: number;
  expiresAt?: string | null;
}

interface StoredPortfolioItem {
  id?: string;
  title?: string;
  category?: string;
  storagePath?: string;
  altText?: string;
  displayOrder?: number;
}

const directoryColumns = [
  "profile_id",
  "slug",
  "kind",
  "display_name",
  "headline",
  "summary",
  "categories",
  "region_code",
  "commune_codes",
  "services",
  "specialties",
  "years_experience",
  "modalities",
  "has_vehicle",
  "availability",
  "score",
  "rating",
  "review_count",
  "badges",
  "qualifications",
  "portfolio",
  "is_verified",
  "is_demo",
].join(",");

const publicBadges = new Set<VerificationBadge>([
  "Identidad revisada",
  "Correo confirmado",
  "Teléfono confirmado",
  "Formación revisada",
  "Perfil completo",
  "Fotografías aprobadas",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseQualifications(value: unknown, profileId: string): Qualification[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry, index) => {
    if (!isObject(entry)) return [];
    const item = entry as StoredQualification;
    if (
      !["professional_degree", "technical_degree", "training"].includes(item.type ?? "") ||
      typeof item.title !== "string" ||
      typeof item.institution !== "string" ||
      typeof item.issuedYear !== "number"
    ) return [];

    return [{
      id: `${profileId}-qualification-${index + 1}`,
      type: item.type as Qualification["type"],
      title: item.title,
      institution: item.institution,
      issuedYear: item.issuedYear,
      ...(typeof item.expiresAt === "string" ? { expiresAt: item.expiresAt } : {}),
      status: "reviewed" as const,
      reviewedAt: "Revisión registrada",
    }];
  });
}

function normalizeModality(value: string): Professional["modalities"][number] | null {
  const mapped: Record<string, Professional["modalities"][number]> = {
    "Atención a domicilio": "Domiciliaria",
    "Atención en taller": "Taller",
    "Diagnóstico remoto inicial": "Diagnóstico remoto inicial",
    Domiciliaria: "Domiciliaria",
    Comercial: "Comercial",
    Taller: "Taller",
  };
  return mapped[value] ?? null;
}

function initialsFor(displayName: string): string {
  return displayName
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("es-CL") ?? "")
    .join("") || "RT";
}

async function signedPortfolioUrls(
  supabase: SupabaseClient,
  rows: DirectoryRow[],
): Promise<Map<string, string>> {
  const paths = [...new Set(rows.flatMap((row) =>
    Array.isArray(row.portfolio)
      ? row.portfolio.flatMap((entry) => isObject(entry) && typeof entry.storagePath === "string" ? [entry.storagePath] : [])
      : [],
  ))];
  if (paths.length === 0) return new Map();

  const { data, error } = await supabase.storage.from("gallery-images").createSignedUrls(paths, 60 * 60);
  if (error || !data) return new Map();
  return new Map(data.flatMap((item) => typeof item.path === "string" && item.signedUrl ? [[item.path, item.signedUrl] as const] : []));
}

function mapPortfolio(value: unknown, signedUrls: Map<string, string>): PortfolioItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((entry) => {
      if (!isObject(entry)) return [];
      const item = entry as StoredPortfolioItem;
      const imageSrc = typeof item.storagePath === "string" ? signedUrls.get(item.storagePath) : undefined;
      if (!imageSrc || typeof item.id !== "string" || typeof item.title !== "string") return [];
      return [{
        id: item.id,
        title: item.title,
        category: typeof item.category === "string" ? item.category : "Trabajo realizado",
        imageSrc,
        alt: typeof item.altText === "string" ? item.altText : `Trabajo realizado: ${item.title}`,
        status: "approved" as const,
        order: typeof item.displayOrder === "number" ? item.displayOrder : 3,
      }];
    })
    .sort((left, right) => left.order - right.order)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      imageSrc: item.imageSrc,
      alt: item.alt,
      status: item.status,
    }));
}

function mapRow(row: DirectoryRow, signedUrls: Map<string, string>): Professional {
  const availability = ["Disponible esta semana", "Agenda limitada", "Solo emergencias"].includes(row.availability ?? "")
    ? row.availability as Professional["availability"]
    : "Agenda limitada";

  return {
    id: row.profile_id,
    slug: row.slug,
    kind: row.kind,
    displayName: row.display_name,
    initials: initialsFor(row.display_name),
    categories: row.categories,
    headline: row.headline,
    summary: row.summary,
    region: regionNameFromCode(row.region_code),
    communes: row.commune_codes,
    services: row.services,
    specialties: row.specialties,
    yearsExperience: row.years_experience,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    score: row.score,
    availability,
    responseTime: "Consulta disponibilidad",
    modalities: row.modalities.flatMap((value) => {
      const modality = normalizeModality(value);
      return modality ? [modality] : [];
    }),
    vehicle: row.has_vehicle,
    badges: row.badges.filter((badge): badge is VerificationBadge => publicBadges.has(badge as VerificationBadge)),
    qualifications: parseQualifications(row.qualifications, row.profile_id),
    portfolio: mapPortfolio(row.portfolio, signedUrls),
    status: row.is_verified ? "verified" : "approved",
    isDemo: row.is_demo,
  };
}

export async function listDirectoryProfessionals(): Promise<Professional[]> {
  if (!isSupabaseMode()) return [...demoProfessionals];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_profiles")
    .select(directoryColumns)
    .eq("is_published", true)
    .eq("is_demo", false)
    .order("score", { ascending: false })
    .limit(200);

  if (error) throw new Error("No fue posible consultar el directorio público.", { cause: error });
  const rows = (data ?? []) as unknown as DirectoryRow[];
  const signedUrls = await signedPortfolioUrls(supabase, rows);
  return rows.map((row) => mapRow(row, signedUrls));
}

export async function getDirectoryProfessional(slug: string): Promise<Professional | undefined> {
  if (!isSupabaseMode()) return getProfessionalBySlug(slug);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_profiles")
    .select(directoryColumns)
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_demo", false)
    .maybeSingle();

  if (error) throw new Error("No fue posible consultar el perfil público.", { cause: error });
  if (!data) return undefined;
  const row = data as unknown as DirectoryRow;
  const signedUrls = await signedPortfolioUrls(supabase, [row]);
  return mapRow(row, signedUrls);
}
