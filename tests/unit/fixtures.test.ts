import { describe, expect, it } from "vitest";
import { demoProfessionals } from "@/data/demo-professionals";

describe("demo professional fixtures", () => {
  it("contains exactly ten explicitly fictitious profiles", () => {
    expect(demoProfessionals).toHaveLength(10);
    expect(demoProfessionals.every((profile) => profile.isDemo)).toBe(true);
  });

  it("uses unique ids and slugs", () => {
    expect(new Set(demoProfessionals.map((profile) => profile.id)).size).toBe(10);
    expect(new Set(demoProfessionals.map((profile) => profile.slug)).size).toBe(10);
  });

  it("contains no private directory fields", () => {
    const forbiddenKeys = ["rut", "address", "bankAccount", "identityDocument", "privateNotes", "administrativeEmail"];
    for (const profile of demoProfessionals) {
      for (const key of forbiddenKeys) {
        expect(profile).not.toHaveProperty(key);
      }
    }
  });

  it("marks every fixture as publicly approved or verified", () => {
    expect(demoProfessionals.every((profile) => ["approved", "verified"].includes(profile.status))).toBe(true);
  });

  it("provides three approved demo works and professional categories", () => {
    expect(demoProfessionals.every((profile) => profile.portfolio.length === 3)).toBe(true);
    expect(demoProfessionals.every((profile) => profile.portfolio.every((item) => item.status === "approved"))).toBe(true);
    expect(new Set(demoProfessionals.flatMap((profile) => profile.categories))).toEqual(new Set(["industrial", "commercial", "residential"]));
  });
});
