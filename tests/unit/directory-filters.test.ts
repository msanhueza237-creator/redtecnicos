import { describe, expect, it } from "vitest";
import { demoProfessionals, serviceCatalog } from "@/data/demo-professionals";
import { filterProfessionals, projectPublicProfessional } from "@/domain/directory";

describe("directory filters", () => {
  it("combines region, service and profile kind", () => {
    const results = filterProfessionals(demoProfessionals, {
      region: "Los Lagos",
      service: serviceCatalog[0],
      kind: "company",
    });
    expect(results.map((profile) => profile.slug)).toEqual(["climasur-demo-spa"]);
  });

  it("finds by a case-insensitive specialty query", () => {
    const results = filterProfessionals(demoProfessionals, { query: "REFRIGERACIÓN" });
    expect(results.length).toBeGreaterThan(1);
  });

  it("excludes all fixtures when demo profiles are disabled", () => {
    expect(filterProfessionals(demoProfessionals, {}, false)).toEqual([]);
  });

  it("orders without mutating the source array", () => {
    const before = demoProfessionals.map((profile) => profile.id);
    const results = filterProfessionals(demoProfessionals, { sort: "score" });
    expect(results[0]?.score).toBeGreaterThanOrEqual(results[1]?.score ?? 0);
    expect(demoProfessionals.map((profile) => profile.id)).toEqual(before);
  });

  it("filters reviewed qualifications and vehicle independently", () => {
    const results = filterProfessionals(demoProfessionals, { certifiedOnly: true, vehicleOnly: true });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((profile) => profile.qualifications.some((qualification) => qualification.status === "reviewed") && profile.vehicle)).toBe(true);
  });

  it("filters the three professional categories", () => {
    const industrial = filterProfessionals(demoProfessionals, { category: "industrial" });
    const commercial = filterProfessionals(demoProfessionals, { category: "commercial" });
    const residential = filterProfessionals(demoProfessionals, { category: "residential" });
    expect(industrial.length).toBeGreaterThan(0);
    expect(commercial.length).toBeGreaterThan(0);
    expect(residential.length).toBeGreaterThan(0);
  });

  it("projects only reviewed qualifications and approved images, up to three", () => {
    const source = demoProfessionals[0]!;
    const projected = projectPublicProfessional({
      ...source,
      qualifications: [...source.qualifications, { id: "QUAL-PRIVATE", type: "training", title: "No publicar", institution: "Demo", issuedYear: 2026, status: "pending_review", reviewedAt: "Pendiente" }],
      portfolio: [...source.portfolio, { ...source.portfolio[0]!, id: "IMAGE-PRIVATE", status: "pending_review" }],
    });
    expect(projected.qualifications.every((qualification) => qualification.status === "reviewed")).toBe(true);
    expect(projected.qualifications.some((qualification) => qualification.id === "QUAL-PRIVATE")).toBe(false);
    expect(projected.portfolio).toHaveLength(3);
    expect(projected.portfolio.every((item) => item.status === "approved")).toBe(true);
  });
});
