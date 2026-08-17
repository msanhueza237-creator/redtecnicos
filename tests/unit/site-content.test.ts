import { describe, expect, it } from "vitest";
import {
  defaultSiteContent,
  siteContentEditorSchema,
  siteContentValueSchema,
} from "@/domain/site-content";

describe("site content", () => {
  it("keeps every fallback block inside the public schema", () => {
    expect(Object.values(defaultSiteContent).every((value) => siteContentValueSchema.safeParse(value).success)).toBe(true);
  });

  it("rejects external destinations and incomplete secondary actions", () => {
    expect(siteContentValueSchema.safeParse({
      ...defaultSiteContent.home_directory_notice,
      primaryCtaHref: "https://example.com",
    }).success).toBe(false);
    expect(siteContentValueSchema.safeParse({
      ...defaultSiteContent.home_directory_notice,
      secondaryCtaHref: "",
    }).success).toBe(false);
  });

  it("requires a reason and a positive revision before saving", () => {
    const parsed = siteContentEditorSchema.safeParse({
      ...defaultSiteContent.home_professional_cta,
      slot: "home_professional_cta",
      expectedRevision: 2,
      reason: "Actualización revisada por administración.",
    });
    expect(parsed.success).toBe(true);
    expect(siteContentEditorSchema.safeParse({
      ...defaultSiteContent.home_professional_cta,
      slot: "home_professional_cta",
      expectedRevision: 0,
      reason: "corto",
    }).success).toBe(false);
  });
});
