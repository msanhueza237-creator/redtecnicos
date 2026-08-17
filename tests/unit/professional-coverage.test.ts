import { describe, expect, it } from "vitest";
import { communeOptionsForRegion } from "@/data/chile-communes";
import {
  orderedCoverageCommunes,
  professionalCoverageSchema,
} from "@/domain/professional-coverage";

const baseCoverage = {
  regionCode: "CL-RM",
  primaryCommune: "Santiago",
  communeNames: ["Santiago", "Providencia"],
  modalities: ["Atención a domicilio"],
  hasVehicle: true,
};

describe("cobertura profesional", () => {
  it("permite seleccionar las 52 comunas de la Región Metropolitana", () => {
    const communeNames = communeOptionsForRegion("CL-RM").map((commune) => commune.name);
    const result = professionalCoverageSchema.safeParse({ ...baseCoverage, communeNames });

    expect(communeNames).toHaveLength(52);
    expect(result.success).toBe(true);
  });

  it("rechaza comunas que pertenecen a otra región", () => {
    const result = professionalCoverageSchema.safeParse({
      ...baseCoverage,
      communeNames: ["Santiago", "Puerto Montt"],
    });

    expect(result.success).toBe(false);
  });

  it("guarda primero la comuna principal y elimina duplicados", () => {
    expect(orderedCoverageCommunes("Santiago", ["Providencia", "Santiago", "Ñuñoa"]))
      .toEqual(["Santiago", "Providencia", "Ñuñoa"]);
  });
});
