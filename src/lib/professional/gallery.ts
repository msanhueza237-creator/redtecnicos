import "server-only";

import type {
  GalleryModerationState,
  ProfessionalGalleryCategory,
  ProfessionalGalleryItem,
} from "@/domain/professional-gallery";
import { createClient } from "@/lib/supabase/server";

interface GalleryRow {
  id: string;
  title: string;
  category: ProfessionalGalleryCategory;
  description: string;
  storage_path: string;
  alt_text: string;
  display_order: number;
  status: GalleryModerationState;
  review_reason: string | null;
  created_at: string;
}

export interface ProfessionalGalleryResult {
  data: ProfessionalGalleryItem[];
  error: string | null;
}

export async function listProfessionalGallery(userId: string): Promise<ProfessionalGalleryResult> {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return { data: [], error: "No fue posible identificar tu perfil profesional." };
  }

  const { data, error } = await supabase
    .from("portfolio_items")
    .select("id,title,category,description,storage_path,alt_text,display_order,status,review_reason,created_at")
    .eq("profile_id", profile.id)
    .order("display_order");

  if (error) return { data: [], error: "No fue posible cargar tu galería." };

  const rows = (data ?? []) as unknown as GalleryRow[];
  if (!rows.length) return { data: [], error: null };

  const { data: signed, error: signedError } = await supabase.storage
    .from("gallery-images")
    .createSignedUrls(rows.map((row) => row.storage_path), 60 * 60);

  if (signedError) {
    return { data: [], error: "No fue posible mostrar las imágenes guardadas." };
  }

  const urls = new Map((signed ?? []).map((item) => [item.path, item.signedUrl]));
  return {
    data: rows.flatMap((row) => {
      const imageUrl = urls.get(row.storage_path);
      return imageUrl ? [{
        id: row.id,
        title: row.title,
        category: row.category,
        description: row.description,
        altText: row.alt_text,
        displayOrder: row.display_order,
        status: row.status,
        reviewReason: row.review_reason,
        createdAt: row.created_at,
        imageUrl,
      }] : [];
    }),
    error: null,
  };
}
