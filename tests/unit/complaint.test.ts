import { describe, expect, it } from "vitest";
import {
  complaintAdminUpdateSchema,
  createComplaintSchema,
} from "@/domain/complaint";

const validComplaint = {
  reporterName: "Cliente Ejemplo",
  reporterEmail: "cliente@example.com",
  reporterPhone: "+56 9 1234 5678",
  category: "professional_conduct" as const,
  subject: "Incumplimiento del horario acordado",
  description: "El profesional no se presentó en el horario confirmado y necesito informar lo ocurrido.",
  relatedType: "profile" as const,
  relatedReference: "tecnico-ejemplo",
  consentAccepted: true as const,
  website: "" as const,
};

describe("reclamos", () => {
  it("acepta un reporte completo y normaliza el correo", () => {
    const result = createComplaintSchema.parse({ ...validComplaint, reporterEmail: " Cliente@Example.com " });
    expect(result.reporterEmail).toBe("cliente@example.com");
  });

  it("rechaza una descripción insuficiente", () => {
    expect(createComplaintSchema.safeParse({ ...validComplaint, description: "Muy breve" }).success).toBe(false);
  });

  it("rechaza el campo trampa utilizado por bots", () => {
    expect(createComplaintSchema.safeParse({ ...validComplaint, website: "spam.example" }).success).toBe(false);
  });

  it("exige un resumen al resolver el caso", () => {
    const result = complaintAdminUpdateSchema.safeParse({
      complaintId: "94fa54f3-0d29-48ee-a6e5-d0ebbb142fa1",
      status: "resolved",
      priority: "medium",
      reason: "Antecedentes revisados por administración.",
      resolutionSummary: "",
    });
    expect(result.success).toBe(false);
  });
});
