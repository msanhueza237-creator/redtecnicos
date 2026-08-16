import "server-only";

import type { ContactRequestStatus } from "@/domain/directory";
import { createClient } from "@/lib/supabase/server";

export interface PrivateContactRequest {
  id: string;
  professionalProfileId: string;
  professionalDisplayName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  commune: string;
  service: string;
  description: string;
  status: ContactRequestStatus;
  emailVerified: boolean;
  createdAt: string;
}

interface RequestRow {
  id: string;
  professional_profile_id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  requester_commune: string;
  requested_service: string;
  description: string;
  status: ContactRequestStatus;
  requester_email_verified_at: string | null;
  created_at: string;
}

async function listVisibleRequests(): Promise<PrivateContactRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_requests")
    .select("id,professional_profile_id,requester_name,requester_email,requester_phone,requester_commune,requested_service,description,status,requester_email_verified_at,created_at")
    .eq("is_demo", false)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("No fue posible consultar las solicitudes.", { cause: error });

  const rows = (data ?? []) as unknown as RequestRow[];
  const profileIds = [...new Set(rows.map((row) => row.professional_profile_id))];
  const profileNames = new Map<string, string>();
  if (profileIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("directory_profiles")
      .select("profile_id,display_name")
      .in("profile_id", profileIds);
    if (profileError) throw new Error("No fue posible consultar los perfiles asociados.", { cause: profileError });
    for (const profile of profiles ?? []) profileNames.set(profile.profile_id, profile.display_name);
  }

  return rows.map((row) => ({
    id: row.id,
    professionalProfileId: row.professional_profile_id,
    professionalDisplayName: profileNames.get(row.professional_profile_id) ?? "Perfil no disponible",
    customerName: row.requester_name,
    customerEmail: row.requester_email,
    customerPhone: row.requester_phone,
    commune: row.requester_commune,
    service: row.requested_service,
    description: row.description,
    status: row.status,
    emailVerified: Boolean(row.requester_email_verified_at),
    createdAt: row.created_at,
  }));
}

export async function listAdminContactRequests(): Promise<PrivateContactRequest[]> {
  return listVisibleRequests();
}

export async function listProfessionalContactRequests(): Promise<PrivateContactRequest[]> {
  return listVisibleRequests();
}

export async function updateOwnedContactRequestStatus(
  requestId: string,
  nextStatus: ContactRequestStatus,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_owned_contact_request_status", {
    p_request_id: requestId,
    p_next_status: nextStatus,
  });
  if (error) throw new Error("No fue posible actualizar la solicitud.", { cause: error });
}
