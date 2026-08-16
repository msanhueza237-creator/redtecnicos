import { describe, expect, it } from "vitest";
import {
  customerContactEmailTemplate,
  professionalRequestEmailTemplate,
  reviewInvitationEmailTemplate,
  smtpTestEmailTemplate,
} from "@/lib/email/templates";

describe("plantillas de correo transaccional", () => {
  it("aplica la identidad de Red Técnicos Chile al correo SMTP", () => {
    const template = smtpTestEmailTemplate();

    expect(template.subject).toContain("Conexión SMTP validada");
    expect(template.html).toContain("Red Técnicos Chile");
    expect(template.html).toContain("#1f5f8f");
    expect(template.html).toContain("#c8ff55");
    expect(template.text).toContain("validada correctamente");
  });

  it("entrega al cliente contacto, verificación y seguimiento", () => {
    const template = customerContactEmailTemplate({
      customerName: "Cliente Ejemplo",
      professionalName: "Técnico Sur",
      professionalEmail: "contacto@example.invalid",
      professionalPhone: "+56 9 1111 2222",
      service: "Mantención",
      commune: "Puerto Montt",
      verificationUrl: "https://redtecnicos.cl/verificar/token",
      trackingUrl: "https://redtecnicos.cl/seguimiento/token",
    });

    expect(template.html).toContain("Confirmar correo");
    expect(template.html).toContain("Ver seguimiento");
    expect(template.html).toContain("contacto@example.invalid");
    expect(template.text).toContain("+56 9 1111 2222");
  });

  it("escapa contenido aportado por clientes en el aviso profesional", () => {
    const template = professionalRequestEmailTemplate({
      customerName: "<script>alert(1)</script>",
      customerEmail: "cliente@example.invalid",
      service: "Diagnóstico",
      commune: "Osorno",
      description: "Equipo detenido\n<script>malicioso()</script>",
      panelUrl: "https://redtecnicos.cl/panel/solicitudes",
    });

    expect(template.html).not.toContain("<script>");
    expect(template.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(template.html).toContain("Equipo detenido<br>&lt;script&gt;malicioso()&lt;/script&gt;");
  });

  it("genera una invitación de evaluación ligada al seguimiento", () => {
    const template = reviewInvitationEmailTemplate({
      customerName: "Cliente Ejemplo",
      professionalName: "Empresa Técnica",
      service: "Refrigeración comercial",
      trackingUrl: "https://redtecnicos.cl/seguimiento/token-opaco",
    });

    expect(template.subject).toContain("Empresa Técnica");
    expect(template.html).toContain("Calificar el servicio");
    expect(template.html).toContain("token-opaco");
    expect(template.text).toContain("una evaluación por solicitud completada");
  });
});
