import { afterEach, describe, expect, it } from "vitest";
import { organicGuides, serviceLandingPages } from "@/data/organic-content";
import { isSearchIndexingEnabled, serializeJsonLd } from "@/lib/seo";

const trackedEnvironment = [
  "SEO_INDEXING_ENABLED",
  "DEPLOYMENT_ENV",
  "APP_DATA_SOURCE",
  "NEXT_PUBLIC_ENABLE_DEMO_PROFILES",
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
] as const;

const originalEnvironment = Object.fromEntries(
  trackedEnvironment.map((name) => [name, process.env[name]]),
);

afterEach(() => {
  for (const name of trackedEnvironment) {
    const original = originalEnvironment[name];
    if (original === undefined) delete process.env[name];
    else process.env[name] = original;
  }
});

describe("search indexing guard", () => {
  it("only opens the canonical real production environment", () => {
    process.env.SEO_INDEXING_ENABLED = "true";
    process.env.DEPLOYMENT_ENV = "production";
    process.env.APP_DATA_SOURCE = "supabase";
    process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES = "false";
    process.env.APP_URL = "https://redtecnicos.cl";

    expect(isSearchIndexingEnabled()).toBe(true);
  });

  it("stays closed for staging, fixtures, demos and non-canonical hosts", () => {
    process.env.SEO_INDEXING_ENABLED = "true";
    process.env.DEPLOYMENT_ENV = "staging";
    process.env.APP_DATA_SOURCE = "supabase";
    process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES = "false";
    process.env.APP_URL = "https://staging.redtecnicos.cl";
    expect(isSearchIndexingEnabled()).toBe(false);

    process.env.DEPLOYMENT_ENV = "production";
    process.env.APP_DATA_SOURCE = "fixtures";
    expect(isSearchIndexingEnabled()).toBe(false);

    process.env.APP_DATA_SOURCE = "supabase";
    process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES = "true";
    expect(isSearchIndexingEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES = "false";
    expect(isSearchIndexingEnabled()).toBe(false);
  });
});

describe("organic content inventory", () => {
  it("keeps unique slugs and valid guide relationships", () => {
    const serviceSlugs = serviceLandingPages.map((page) => page.slug);
    const guideSlugs = organicGuides.map((guide) => guide.slug);

    expect(new Set(serviceSlugs).size).toBe(serviceSlugs.length);
    expect(new Set(guideSlugs).size).toBe(guideSlugs.length);
    expect(serviceLandingPages.every((page) =>
      page.relatedGuideSlugs.every((slug) => guideSlugs.includes(slug))
    )).toBe(true);
    expect(organicGuides.every((guide) =>
      !guide.serviceSlug || serviceSlugs.includes(guide.serviceSlug)
    )).toBe(true);
  });

  it("escapes HTML-opening characters in JSON-LD", () => {
    expect(serializeJsonLd({ value: "</script><script>" }))
      .toBe('{"value":"\\u003c/script>\\u003cscript>"}');
  });
});
