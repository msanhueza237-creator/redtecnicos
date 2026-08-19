import { describe, expect, it } from "vitest";
import {
  administratorRegistrationEmailTemplate,
  applicantRegistrationEmailTemplate,
  customerContactEmailTemplate,
  professionalRequestEmailTemplate,
  professionalChangeAdministratorEmailTemplate,
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

  it("avisa al administrador sin incluir documentos privados", () => {
    const template = administratorRegistrationEmailTemplate({
      applicantName: "Responsable <Ejemplo>",
      applicantEmail: "postulante@example.invalid",
      displayName: "Frío Sur Ejemplo",
      professionalKind: "Empresa",
      category: "Refrigeración comercial",
      region: "Los Lagos",
      commune: "Puerto Montt",
      adminUrl: "https://redtecnicos.cl/admin/postulaciones",
    });

    expect(template.subject).toContain("Frío Sur Ejemplo");
    expect(template.html).toContain("Revisar postulación");
    expect(template.html).toContain("Responsable &lt;Ejemplo&gt;");
    expect(template.html).not.toContain("documento adjunto");
    expect(template.text).toContain("Estado: En revisión");
  });

  it("confirma al postulante que su perfil está en revisión", () => {
    const template = applicantRegistrationEmailTemplate({
      applicantName: "Técnico Ejemplo",
      displayName: "Servicio Técnico Ejemplo",
      professionalKind: "Técnico independiente",
      loginUrl: "https://redtecnicos.cl/ingresar",
    });

    expect(template.subject).toContain("Recibimos tu postulación");
    expect(template.html).toContain("Tu perfil quedó en revisión");
    expect(template.text).toContain("correo separado para confirmar");
    expect(template.text).toContain("no se publicará");
  });

  it("avisa al administrador cuando un profesional modifica su perfil", () => {
    const template = professionalChangeAdministratorEmailTemplate({
      applicantName: "Responsable Ejemplo",
      applicantEmail: "responsable@example.invalid",
      professionalName: "Clima Sur Ejemplo",
      professionalKind: "Empresa",
      section: "Servicios y especialidades",
      adminUrl: "https://redtecnicos.cl/admin/postulaciones/123",
    });

    expect(template.subject).toContain("Clima Sur Ejemplo");
    expect(template.html).toContain("Hay cambios pendientes de revisión");
    expect(template.html).toContain("Servicios y especialidades");
    expect(template.html).toContain("Revisar cambios");
    expect(template.text).toContain("Pendiente de revisión");
  });
});
