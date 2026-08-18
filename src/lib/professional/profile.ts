import "server-only";

import type { ProfessionalCategory, ProfessionalKind } from "@/domain/directory";
import type { QualificationModerationState } from "@/domain/professional-qualification";
import { getAppSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface OwnedProfessionalProfile {
  id: string;
  kind: ProfessionalKind;
  displayName: string;
  headline: string;
  summary: string;
  categories: ProfessionalCategory[];
  yearsExperience: number;
  services: string[];
  specialties: string[];
  brands: string[];
  equipmentTypes: string[];
  availability: string;
  workingHours: string;
  emergencyAvailable: boolean;
  acceptsNewRequests: boolean;
  issuesInvoice: boolean;
  issuesReceipt: boolean;
  writtenQuotes: boolean;
  declaredWarranty: string;
  paymentMethods: string[];
  publicEmail: string;
  publicPhone: string;
  whatsappPhone: string;
  avatarStatus: QualificationModerationState;
  avatarReviewReason: string | null;
  avatarUrl: string | null;
  status: string;
  reviewReason: string | null;
}

interface ProfileRow {
  id: string;
  kind: ProfessionalKind;
  display_name: string;
  headline: string;
  summary: string;
  categories: ProfessionalCategory[];
  years_experience: number;
  services: string[];
  specialties: string[];
  brands: string[];
  equipment_types: string[];
  availability: string | null;
  working_hours: string;
  emergency_available: boolean;
  accepts_new_requests: boolean;
  issues_invoice: boolean;
  issues_receipt: boolean;
  written_quotes: boolean;
  declared_warranty: string;
  payment_methods: string[];
  avatar_path: string | null;
  avatar_status: QualificationModerationState;
  avatar_review_reason: string | null;
  status: string;
  review_reason: string | null;
}

export async function getOwnedProfessionalProfile(): Promise<OwnedProfessionalProfile | null> {
  const session = await getAppSession();
  if (!session?.userId || session.source !== "supabase") return null;

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select("id,kind,display_name,headline,summary,categories,years_experience,services,specialties,brands,equipment_types,availability,working_hours,emergency_available,accepts_new_requests,issues_invoice,issues_receipt,written_quotes,declared_warranty,payment_methods,avatar_path,avatar_status,avatar_review_reason,status,review_reason")
    .eq("owner_user_id", session.userId)
    .maybeSingle();

  if (profileError) throw new Error("No fue posible cargar tu perfil profesional.", { cause: profileError });
  if (!profile) return null;
  const row = profile as unknown as ProfileRow;

  const { data: contact, error: contactError } = await supabase
    .from("professional_contacts")
    .select("public_email,public_phone,whatsapp_phone")
    .eq("profile_id", row.id)
    .maybeSingle();
  if (contactError) throw new Error("No fue posible cargar tus datos de contacto.", { cause: contactError });

  let avatarUrl: string | null = null;
  if (row.avatar_path) {
    const { data: signed } = await supabase.storage.from("profile-images").createSignedUrl(row.avatar_path, 60 * 60);
    avatarUrl = signed?.signedUrl ?? null;
  }

  return {
    id: row.id,
    kind: row.kind,
    displayName: row.display_name,
    headline: row.headline,
    summary: row.summary,
    categories: row.categories ?? [],
    yearsExperience: row.years_experience,
    services: row.services ?? [],
    specialties: row.specialties ?? [],
    brands: row.brands ?? [],
    equipmentTypes: row.equipment_types ?? [],
    availability: row.availability ?? "Agenda limitada",
    workingHours: row.working_hours ?? "",
    emergencyAvailable: row.emergency_available,
    acceptsNewRequests: row.accepts_new_requests,
    issuesInvoice: row.issues_invoice,
    issuesReceipt: row.issues_receipt,
    writtenQuotes: row.written_quotes,
    declaredWarranty: row.declared_warranty ?? "",
    paymentMethods: row.payment_methods ?? [],
    publicEmail: contact?.public_email ?? session.email ?? "",
    publicPhone: contact?.public_phone ?? "",
    whatsappPhone: contact?.whatsapp_phone ?? contact?.public_phone ?? "",
    avatarStatus: row.avatar_status,
    avatarReviewReason: row.avatar_review_reason,
    avatarUrl,
    status: row.status,
    reviewReason: row.review_reason,
  };
}
