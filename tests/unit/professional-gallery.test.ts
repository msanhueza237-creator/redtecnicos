import { describe, expect, it } from "vitest";
import {
  galleryItemInputSchema,
  galleryStatusClass,
  galleryStatusLabel,
  MAX_GALLERY_BATCH_FILES,
  MAX_GALLERY_ITEMS,
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

  it("encuentra una de las cinco posiciones permitidas", () => {
    expect(nextAvailableGalleryOrder([])).toBe(1);
    expect(nextAvailableGalleryOrder([1, 2, 4, 5])).toBe(3);
    expect(nextAvailableGalleryOrder([1, 2, 3, 4, 5])).toBeNull();
    expect(MAX_GALLERY_ITEMS).toBe(5);
    expect(MAX_GALLERY_BATCH_FILES).toBe(5);
  });

  it("presenta estados comprensibles para el profesional", () => {
    expect(galleryStatusLabel("pending_review")).toBe("En revisión");
    expect(galleryStatusLabel("changes_requested")).toBe("Cambios solicitados");
    expect(galleryStatusClass("reviewed")).toBe("is-approved");
    expect(galleryStatusClass("hidden")).toBe("is-danger");
  });
});
