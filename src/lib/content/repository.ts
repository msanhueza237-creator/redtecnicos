import "server-only";

import {
  defaultSiteContent,
  siteContentSlotKeys,
  siteContentSlotSchema,
  siteContentValueSchema,
  type AdminSiteContentEntry,
  type PublicSiteContentEntry,
  type SiteContentSlot,
  type SiteContentValue,
} from "@/domain/site-content";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/config";

interface PublicContentRow {
  slot: string;
  content: unknown;
  version: number;
  published_at: string;
}

interface AdminContentRow {
  slot: string;
  label: string;
  description: string;
  draft_content: unknown;
  published_content: unknown;
  revision: number;
  published_revision: number;
  published_version: number;
  updated_at: string;
  published_at: string;
}

function fixtureEntries(): PublicSiteContentEntry[] {
  return siteContentSlotKeys.map((slot) => ({
    slot,
    content: defaultSiteContent[slot],
    version: 1,
    publishedAt: "2026-08-17T00:00:00.000Z",
  }));
}

export async function listPublicSiteContent(): Promise<PublicSiteContentEntry[]> {
  if (!isSupabaseMode()) return fixtureEntries();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_site_content");
  if (error) return fixtureEntries();

  const entries: PublicSiteContentEntry[] = [];
  for (const row of (data ?? []) as PublicContentRow[]) {
    const slot = siteContentSlotSchema.safeParse(row.slot);
    const content = siteContentValueSchema.safeParse(row.content);
    if (!slot.success || !content.success) continue;
    entries.push({
      slot: slot.data,
      content: content.data,
      version: row.version,
      publishedAt: row.published_at,
    });
  }
  return entries.length ? entries : fixtureEntries();
}

export async function getPublicSiteContentMap(): Promise<Record<SiteContentSlot, SiteContentValue>> {
  const entries = await listPublicSiteContent();
  const result = { ...defaultSiteContent };
  for (const entry of entries) result[entry.slot] = entry.content;
  return result;
}

export async function listAdminSiteContent(): Promise<{ data: AdminSiteContentEntry[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_admin_site_content");
  if (error) return { data: [], error: "No fue posible cargar el contenido desde Supabase." };

  const entries: AdminSiteContentEntry[] = [];
  for (const row of (data ?? []) as AdminContentRow[]) {
    const slot = siteContentSlotSchema.safeParse(row.slot);
    const draft = siteContentValueSchema.safeParse(row.draft_content);
    const published = siteContentValueSchema.safeParse(row.published_content);
    if (!slot.success || !draft.success || !published.success) continue;
    entries.push({
      slot: slot.data,
      label: row.label,
      description: row.description,
      draft: draft.data,
      published: published.data,
      revision: row.revision,
      publishedRevision: row.published_revision,
      publishedVersion: row.published_version,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    });
  }

  return {
    data: siteContentSlotKeys.flatMap((slot) => entries.filter((entry) => entry.slot === slot)),
    error: entries.length === siteContentSlotKeys.length ? null : "Uno o más bloques tienen un formato inválido y no se mostraron.",
  };
}
