import type { MetadataRoute } from "next";
import { organicGuides, serviceLandingPages } from "@/data/organic-content";
import { listDirectoryProfessionals } from "@/lib/directory/repository";
import { isSearchIndexingEnabled, professionalProfilePath } from "@/lib/seo";
import { publicSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const publicRoutes = [
  "/",
  "/tecnicos",
  "/servicios",
  "/guias",
  "/como-funciona",
  "/preguntas-frecuentes",
  "/registro-tecnico",
  "/registro-empresa",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSearchIndexingEnabled()) return [];

  const professionals = await listDirectoryProfessionals();
  const contentUpdatedAt = new Date("2026-08-17T12:00:00-04:00");

  return [
    ...publicRoutes.map((pathname, index) => ({
      url: publicSiteUrl(pathname),
      lastModified: contentUpdatedAt,
      changeFrequency: pathname === "/" || pathname === "/tecnicos" ? "daily" as const : "monthly" as const,
      priority: index === 0 ? 1 : pathname === "/tecnicos" ? 0.9 : 0.7,
    })),
    ...serviceLandingPages.map((page) => ({
      url: publicSiteUrl(`/servicios/${page.slug}`),
      lastModified: new Date(`${page.updatedAt}T12:00:00-04:00`),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...organicGuides.map((guide) => ({
      url: publicSiteUrl(`/guias/${guide.slug}`),
      lastModified: new Date(`${guide.updatedAt}T12:00:00-04:00`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...professionals.map((professional) => ({
      url: publicSiteUrl(professionalProfilePath(professional)),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
