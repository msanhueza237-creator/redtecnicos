import { describe, expect, it } from "vitest";
import { calculateDirectoryMetrics } from "@/domain/directory-metrics";

describe("métricas públicas del directorio", () => {
  it("calcula la calificación ponderada por cantidad de evaluaciones", () => {
    const metrics = calculateDirectoryMetrics([
      { communes: ["Santiago", "Providencia"], rating: 5, reviewCount: 1 },
      { communes: ["Providencia", "Ñuñoa"], rating: 4, reviewCount: 3 },
    ]);

    expect(metrics).toEqual({
      profileCount: 2,
      communeCount: 3,
      publishedReviewCount: 4,
      averageRating: 4.25,
    });
  });

  it("no inventa una calificación cuando todavía no hay evaluaciones", () => {
    expect(calculateDirectoryMetrics([
      { communes: ["Santiago"], rating: 0, reviewCount: 0 },
    ])).toEqual({
      profileCount: 1,
      communeCount: 1,
      publishedReviewCount: 0,
      averageRating: 0,
    });
  });
});
