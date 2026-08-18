import { describe, expect, it } from "vitest";
import {
  professionalMainProfileSchema,
  professionalPreferencesSchema,
  professionalReviewReplySchema,
  professionalServicesProfileSchema,
  splitOptionalList,
} from "@/domain/professional-profile";
import { identityDocumentSubmissionSchema } from "@/domain/identity-document";

describe("perfil profesional posterior al registro", () => {
  it("valida la información principal y normaliza los contactos", () => {
    const result = professionalMainProfileSchema.parse({ displayName: "Servicio Técnico Austral", headline: "Refrigeración comercial", summary: "Atención de sistemas de refrigeración comercial con diagnóstico y mantenimiento preventivo.", categories: ["commercial"], yearsExperience: "8", publicEmail: "TECNICO@EXAMPLE.COM", publicPhone: "912345678", whatsappPhone: "+56912345678" });
    expect(result.publicEmail).toBe("tecnico@example.com");
    expect(result.publicPhone).toBe("+56 9 1234 5678");
    expect(result.yearsExperience).toBe(8);
  });

  it("limita servicios, especialidades, marcas y equipos", () => {
    expect(professionalServicesProfileSchema.safeParse({ services: [], specialties: [], brands: [], equipmentTypes: [] }).success).toBe(false);
    expect(professionalServicesProfileSchema.safeParse({ services: ["Diagnóstico técnico"], specialties: Array.from({ length: 13 }, (_, index) => `Especialidad ${index}`), brands: [], equipmentTypes: [] }).success).toBe(false);
  });

  it("acepta pausar solicitudes y declarar condiciones comerciales", () => {
    const result = professionalPreferencesSchema.parse({ availability: "No disponible temporalmente", workingHours: "Lunes a viernes", emergencyAvailable: false, acceptsNewRequests: false, issuesInvoice: true, issuesReceipt: false, writtenQuotes: true, declaredWarranty: "90 días según presupuesto", paymentMethods: ["Transferencia"] });
    expect(result.acceptsNewRequests).toBe(false);
    expect(result.issuesInvoice).toBe(true);
  });

  it("separa listas opcionales por coma, punto y coma o línea", () => {
    expect(splitOptionalList("Carrier, Midea; LG\nDaikin")).toEqual(["Carrier", "Midea", "LG", "Daikin"]);
  });

  it("limita la respuesta pública a una evaluación válida", () => {
    expect(professionalReviewReplySchema.safeParse({ reviewId: "550e8400-e29b-41d4-a716-446655440000", reply: "Gracias por confiar en nuestro trabajo." }).success).toBe(true);
    expect(professionalReviewReplySchema.safeParse({ reviewId: "no-es-uuid", reply: "Gracias" }).success).toBe(false);
  });

  it("solo admite los dos tipos privados de identidad", () => {
    expect(identityDocumentSubmissionSchema.parse({ documentType: "identity_document", subjectName: "Técnico de prueba" }).documentType).toBe("identity_document");
    expect(identityDocumentSubmissionSchema.safeParse({ documentType: "rut_publico", subjectName: "Técnico de prueba" }).success).toBe(false);
  });
});
