import { describe, expect, it } from "vitest";
import {
  qualificationStatusClass,
  qualificationStatusLabel,
  qualificationSubmissionSchema,
  qualificationTypeLabel,
} from "@/domain/professional-qualification";
import {
  detectQualificationDocumentMime,
  normalizeOriginalDocumentName,
  parseClamAvResponse,
} from "@/domain/document-security";

describe("professional qualifications", () => {
  it("valida los datos mínimos de un título o capacitación", () => {
    expect(qualificationSubmissionSchema.parse({
      type: "technical_degree",
      title: "Técnico en Refrigeración",
      institution: "Instituto Técnico de Chile",
      issuedYear: "2021",
      expiresAt: "",
    })).toMatchObject({ issuedYear: 2021, expiresAt: null });

    expect(qualificationSubmissionSchema.safeParse({
      type: "unknown",
      title: "X",
      institution: "Y",
      issuedYear: "1940",
      expiresAt: "",
    }).success).toBe(false);
  });

  it("detecta la firma real y no depende de la extensión", () => {
    expect(detectQualificationDocumentMime(Buffer.from("%PDF-1.7\ncontenido", "ascii"))).toBe("application/pdf");
    expect(detectQualificationDocumentMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectQualificationDocumentMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectQualificationDocumentMime(Buffer.from("archivo.exe", "ascii"))).toBeNull();
  });

  it("interpreta respuestas limpias, infectadas y erróneas de ClamAV", () => {
    expect(parseClamAvResponse("stream: OK\0")).toEqual({ status: "clean" });
    expect(parseClamAvResponse("stream: Eicar-Test-Signature FOUND\0")).toEqual({ status: "infected", threat: "Eicar-Test-Signature" });
    expect(parseClamAvResponse("stream: size limit exceeded ERROR\0").status).toBe("error");
  });

  it("normaliza nombres y presenta estados comprensibles", () => {
    expect(normalizeOriginalDocumentName("../titulo\u0000 oficial.pdf")).not.toContain("/");
    expect(qualificationTypeLabel("training")).toBe("Capacitación o certificación");
    expect(qualificationStatusLabel("pending_review")).toBe("En revisión");
    expect(qualificationStatusClass("reviewed")).toBe("is-approved");
  });
});
