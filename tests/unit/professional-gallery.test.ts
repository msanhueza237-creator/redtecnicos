import { describe, expect, it } from "vitest";
import {
  galleryItemInputSchema,
  galleryStatusClass,
  galleryStatusLabel,
  nextAvailableGalleryOrder,
} from "@/domain/professional-gallery";

describe("professional gallery", () => {
  it("valida los metadatos mínimos de un trabajo", () => {
    expect(galleryItemInputSchema.parse({
      title: "Instalación split",
      category: "residential",
      description: "Instalación terminada y puesta en marcha del equipo.",
    })).toEqual({
      title: "Instalación split",
      category: "residential",
      description: "Instalación terminada y puesta en marcha del equipo.",
    });

    expect(galleryItemInputSchema.safeParse({
      title: "X",
      category: "otra",
      description: "Breve",
    }).success).toBe(false);
  });

  it("encuentra solo una de las tres posiciones permitidas", () => {
    expect(nextAvailableGalleryOrder([])).toBe(1);
    expect(nextAvailableGalleryOrder([1, 3])).toBe(2);
    expect(nextAvailableGalleryOrder([1, 2, 3])).toBeNull();
  });

  it("presenta estados comprensibles para el profesional", () => {
    expect(galleryStatusLabel("pending_review")).toBe("En revisión");
    expect(galleryStatusLabel("changes_requested")).toBe("Cambios solicitados");
    expect(galleryStatusClass("reviewed")).toBe("is-approved");
    expect(galleryStatusClass("hidden")).toBe("is-danger");
  });
});
