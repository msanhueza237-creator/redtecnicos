import "server-only";

import type { AppSession } from "@/lib/auth/session";
import {
  sendProfessionalChangeNotificationEmail,
  type SingleMailDeliveryResult,
} from "@/lib/email/smtp";
import { publicSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export type ProfessionalChangeSection =
  | "Perfil principal y datos de contacto"
  | "Servicios y especialidades"
  | "Cobertura y comunas"
  | "Disponibilidad y condiciones comerciales"
  | "Fotografía profesional"
  | "Galería de trabajos";

export async function notifyAdministratorOfProfessionalChange(
  session: Pick<AppSession, "userId" | "email" | "displayName">,
  section: ProfessionalChangeSection,
): Promise<SingleMailDeliveryResult> {
  if (!session.userId) return "skipped";

  try {
    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from("professional_profiles")
      .select("id,display_name,kind")
      .eq("owner_user_id", session.userId)
      .maybeSingle();
    if (error || !profile) return "failed";

    return sendProfessionalChangeNotificationEmail({
      applicantName: session.displayName ?? profile.display_name,
      applicantEmail: session.email,
      professionalName: profile.display_name,
      professionalKind: profile.kind === "company" ? "Empresa" : "Técnico independiente",
      section,
      adminUrl: publicSiteUrl(`/admin/postulaciones/${encodeURIComponent(profile.id)}`),
    });
  } catch {
    return "failed";
  }
}
