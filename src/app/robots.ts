import type { MetadataRoute } from "next";
import { isSearchIndexingEnabled } from "@/lib/seo";
import { getPublicSiteOrigin, publicSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!isSearchIndexingEnabled()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/panel",
        "/acceso-demo",
        "/ingresar",
        "/seguimiento",
      ],
    },
    host: getPublicSiteOrigin(),
    sitemap: publicSiteUrl("/sitemap.xml"),
  };
}
