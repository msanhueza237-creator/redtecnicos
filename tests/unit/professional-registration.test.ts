import { describe, expect, it } from "vitest";
import {
  professionalRegistrationSchema,
  professionalServices,
} from "@/domain/professional-registration";

const validRegistration = {
  fullName: "Técnico Ejemplo",
  email: "tecnico@example.com",
  phone: "+56 9 1234 5678",
  password: "ClaveSegura2026",
  confirmPassword: "ClaveSegura2026",
  kind: "technician" as const,
  displayName: "Técnico Ejemplo",
  category: "residential" as const,
  yearsExperience: "8",
  summary: "Especialista en instalación, diagnóstico y mantención de climatización residencial.",
  services: [professionalServices[0], professionalServices[1]],
  regionCode: "CL-RM",
  commune: "Santiago",
  modalities: ["Atención a domicilio"],
  hasVehicle: true,
  terms: "on" as const,
};

describe("registro profesional breve", () => {
  it("acepta la información mínima y normaliza correo y experiencia", () => {
    const result = professionalRegistrationSchema.parse(validRegistration);

    expect(result.email).toBe("tecnico@example.com");
    expect(result.yearsExperience).toBe(8);
    expect(result.services).toHaveLength(2);
  });

  it("rechaza celulares que no tengan formato chileno", () => {
    const result = professionalRegistrationSchema.safeParse({ ...validRegistration, phone: "+54 9 1234 5678" });
    expect(result.success).toBe(false);
  });

  it("limita la selección a seis servicios", () => {
    const result = professionalRegistrationSchema.safeParse({
      ...validRegistration,
      services: professionalServices.slice(0, 7),
    });
    expect(result.success).toBe(false);
  });

  it("no incluye referencias, galería, títulos ni documentos en el registro inicial", () => {
    const keys = Object.keys(professionalRegistrationSchema.shape);
    expect(keys).not.toContain("references");
    expect(keys).not.toContain("portfolio");
    expect(keys).not.toContain("qualifications");
    expect(keys).not.toContain("documents");
  });
});
