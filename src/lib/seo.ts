import type { Metadata } from "next";
import type { Professional } from "@/domain/directory";
import { getPublicSiteOrigin, publicSiteUrl } from "@/lib/site-url";

const PRODUCTION_HOSTS = new Set(["redtecnicos.cl", "www.redtecnicos.cl"]);

export function isSearchIndexingEnabled(): boolean {
  if (process.env.SEO_INDEXING_ENABLED !== "true") return false;
  if (process.env.DEPLOYMENT_ENV !== "production") return false;
  if (process.env.APP_DATA_SOURCE !== "supabase") return false;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES === "true") return false;

  try {
    const origin = new URL(getPublicSiteOrigin());
    return origin.protocol === "https:" && PRODUCTION_HOSTS.has(origin.hostname);
  } catch {
    return false;
  }
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</gu, "\\u003c");
}

export function professionalProfilePath(professional: Pick<Professional, "kind" | "slug">): string {
  return professional.kind === "company"
    ? `/empresas/${professional.slug}`
    : `/tecnicos/${professional.slug}`;
}

export function buildProfessionalMetadata(
  professional: Professional | undefined,
  expectedKind: Professional["kind"],
): Metadata {
  if (!professional || professional.kind !== expectedKind) {
    return {
      title: "Perfil no encontrado",
      robots: { index: false, follow: false },
    };
  }

  const pathname = professionalProfilePath(professional);
  const primaryService = professional.services[0] ?? "refrigeración y climatización";
  const description = `${professional.displayName}: ${primaryService} en ${professional.region}. Revisa cobertura, experiencia, servicios e información publicada antes de solicitar contacto.`;
  const indexable = !professional.isDemo && isSearchIndexingEnabled();

  return {
    title: `${professional.displayName} — ${primaryService}`,
    description,
    alternates: { canonical: pathname },
    openGraph: {
      type: "profile",
      url: pathname,
      title: professional.displayName,
      description,
      siteName: "Red Técnicos Chile",
      locale: "es_CL",
    },
    robots: {
      index: indexable,
      follow: indexable,
    },
  };
}

export function buildProfessionalJsonLd(professional: Professional): unknown {
  const pathname = professionalProfilePath(professional);
  const url = publicSiteUrl(pathname);
  const mainEntity = professional.kind === "company"
    ? {
        "@type": "Organization",
        "@id": `${url}#professional`,
        name: professional.displayName,
        description: professional.summary,
        url,
        areaServed: [professional.region, ...professional.communes],
        knowsAbout: [...professional.services, ...professional.specialties],
      }
    : {
        "@type": "Person",
        "@id": `${url}#professional`,
        name: professional.displayName,
        description: professional.summary,
        url,
        jobTitle: professional.headline,
        areaServed: [professional.region, ...professional.communes],
        knowsAbout: [...professional.services, ...professional.specialties],
      };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#profile-page`,
        url,
        name: professional.displayName,
        description: professional.summary,
        mainEntity: { "@id": `${url}#professional` },
        isPartOf: { "@id": `${getPublicSiteOrigin()}/#website` },
      },
      mainEntity,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: publicSiteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Directorio", item: publicSiteUrl("/tecnicos") },
          { "@type": "ListItem", position: 3, name: professional.displayName, item: url },
        ],
      },
    ],
  };
}
