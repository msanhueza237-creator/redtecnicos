import "server-only";

import type { AdminStatusTone } from "@/data/admin-demo";
import {
  galleryStatusLabel,
  type GalleryModerationState,
  type ProfessionalGalleryCategory,
} from "@/domain/professional-gallery";
import { createClient } from "@/lib/supabase/server";

export interface AdminGalleryItem {
  id: string;
  profileId: string;
  owner: string;
  title: string;
  category: ProfessionalGalleryCategory;
  description: string;
  altText: string;
  displayOrder: number;
  status: GalleryModerationState;
  reviewReason: string | null;
  createdAt: string;
  imageUrl: string;
}

interface GalleryRow {
  id: string;
  profile_id: string;
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

export async function listAdminGalleryItems(limit = 100): Promise<{ data: AdminGalleryItem[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("id,profile_id,title,category,description,storage_path,alt_text,display_order,status,review_reason,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: "No fue posible cargar las galerías desde Supabase." };
  const rows = (data ?? []) as unknown as GalleryRow[];
  if (!rows.length) return { data: [], error: null };

  const profileIds = [...new Set(rows.map((row) => row.profile_id))];
  const [{ data: profiles, error: profilesError }, { data: signed, error: signedError }] = await Promise.all([
    supabase.from("professional_profiles").select("id,display_name").in("id", profileIds),
    supabase.storage.from("gallery-images").createSignedUrls(rows.map((row) => row.storage_path), 60 * 60),
  ]);
  if (profilesError || signedError) {
    return { data: [], error: "No fue posible completar las fotografías y sus propietarios." };
  }

  const owners = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const urls = new Map((signed ?? []).map((item) => [item.path, item.signedUrl]));
  return {
    data: rows.flatMap((row) => {
      const imageUrl = urls.get(row.storage_path);
      return imageUrl ? [{
        id: row.id,
        profileId: row.profile_id,
        owner: owners.get(row.profile_id) ?? "Profesional no disponible",
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

export function adminGalleryStatusTone(status: GalleryModerationState): AdminStatusTone {
  if (status === "reviewed") return "success";
  if (status === "pending_review") return "info";
  if (status === "changes_requested") return "warning";
  if (["hidden", "rejected"].includes(status)) return "danger";
  return "neutral";
}

export { galleryStatusLabel as adminGalleryStatusLabel };
