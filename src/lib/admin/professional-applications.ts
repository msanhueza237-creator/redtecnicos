import "server-only";

import type { AdminStatusTone } from "@/data/admin-demo";
import { createClient } from "@/lib/supabase/server";

export type ProfessionalProfileStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "verified"
  | "suspended"
  | "rejected"
  | "deleted"
  | "expired_documents";

export interface AdminProfessionalApplication {
  id: string;
  kind: "technician" | "company";
  displayName: string;
  headline: string;
  summary: string;
  categories: string[];
  regionCode: string | null;
  communeCodes: string[];
  services: string[];
  yearsExperience: number;
  modalities: string[];
  hasVehicle: boolean;
  status: ProfessionalProfileStatus;
  submittedAt: string | null;
  updatedAt: string;
  reviewReason: string | null;
  email?: string;
  phone?: string;
  whatsappPhone?: string | null;
  qualifications?: Array<{
    id: string;
    type: string;
    title: string;
    institution: string;
    year: number;
    status: string;
  }>;
  portfolio?: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    storagePath: string;
    status: string;
  }>;
}

export interface AdminApplicationsResult {
  data: AdminProfessionalApplication[];
  error: string | null;
}

interface ProfileRow {
  id: string;
  kind: "technician" | "company";
  display_name: string;
  headline: string;
  summary: string;
  categories: string[];
  region_code: string | null;
  commune_codes: string[];
  services: string[];
  years_experience: number;
  modalities: string[];
  has_vehicle: boolean;
  status: ProfessionalProfileStatus;
  submitted_at: string | null;
  updated_at: string;
  review_reason: string | null;
}

function mapProfile(row: ProfileRow): AdminProfessionalApplication {
  return {
    id: row.id,
    kind: row.kind,
    displayName: row.display_name,
    headline: row.headline,
    summary: row.summary,
    categories: row.categories,
    regionCode: row.region_code,
    communeCodes: row.commune_codes,
    services: row.services,
    yearsExperience: row.years_experience,
    modalities: row.modalities,
    hasVehicle: row.has_vehicle,
    status: row.status,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
    reviewReason: row.review_reason,
  };
}

const profileFields = "id, kind, display_name, headline, summary, categories, region_code, commune_codes, services, years_experience, modalities, has_vehicle, status, submitted_at, updated_at, review_reason";

export async function listProfessionalApplications(limit = 100): Promise<AdminApplicationsResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(profileFields)
    .in("status", ["submitted", "under_review", "changes_requested", "approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: "No fue posible cargar las postulaciones desde Supabase." };
  return { data: (data as unknown as ProfileRow[]).map(mapProfile), error: null };
}

export async function getProfessionalApplication(id: string): Promise<{ data: AdminProfessionalApplication | null; error: string | null }> {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select(profileFields)
    .eq("id", id)
    .maybeSingle();

  if (profileError) return { data: null, error: "No fue posible cargar la postulación desde Supabase." };
  if (!profile) return { data: null, error: null };

  const [{ data: contact }, { data: qualifications }, { data: portfolio }] = await Promise.all([
    supabase.from("professional_contacts").select("public_email, public_phone, whatsapp_phone").eq("profile_id", id).maybeSingle(),
    supabase.from("qualifications").select("id, qualification_type, title, institution, issued_year, status").eq("profile_id", id).order("issued_year", { ascending: false }),
    supabase.from("portfolio_items").select("id, title, category, description, storage_path, status").eq("profile_id", id).order("display_order"),
  ]);

  const result = mapProfile(profile as unknown as ProfileRow);
  const contactRow = contact as null | { public_email: string; public_phone: string; whatsapp_phone: string | null };
  const qualificationRows = (qualifications ?? []) as Array<{ id: string; qualification_type: string; title: string; institution: string; issued_year: number; status: string }>;
  const portfolioRows = (portfolio ?? []) as Array<{ id: string; title: string; category: string; description: string; storage_path: string; status: string }>;

  return {
    data: {
      ...result,
      email: contactRow?.public_email,
      phone: contactRow?.public_phone,
      whatsappPhone: contactRow?.whatsapp_phone,
      qualifications: qualificationRows.map((item) => ({
        id: item.id,
        type: item.qualification_type,
        title: item.title,
        institution: item.institution,
        year: item.issued_year,
        status: item.status,
      })),
      portfolio: portfolioRows.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        description: item.description,
        storagePath: item.storage_path,
        status: item.status,
      })),
    },
    error: null,
  };
}

export const profileStatusLabels: Record<ProfessionalProfileStatus, string> = {
  draft: "Borrador",
  submitted: "Enviada",
  under_review: "En revisión",
  changes_requested: "Cambios solicitados",
  approved: "Publicada",
  verified: "Verificada",
  suspended: "Suspendida",
  rejected: "Rechazada",
  deleted: "Eliminada",
  expired_documents: "Documentos vencidos",
};

export function profileStatusTone(status: ProfessionalProfileStatus): AdminStatusTone {
  if (["approved", "verified"].includes(status)) return "success";
  if (["submitted", "under_review"].includes(status)) return "info";
  if (["changes_requested", "expired_documents"].includes(status)) return "warning";
  if (["rejected", "suspended", "deleted"].includes(status)) return "danger";
  return "neutral";
}
