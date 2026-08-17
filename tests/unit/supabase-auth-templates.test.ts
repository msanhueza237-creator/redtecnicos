import { describe, expect, it } from "vitest";
import {
  isSupabaseAuthTemplateName,
  supabaseAuthEmailTemplate,
  supabaseAuthTemplateNames,
  supabaseAuthTemplateSubjects,
} from "@/lib/email/supabase-auth-templates";

describe("plantillas de Supabase Auth", () => {
  it("publica los cuatro flujos habilitados", () => {
    expect(supabaseAuthTemplateNames).toEqual([
      "confirmation",
      "recovery",
      "invite",
      "email-change",
    ]);
    expect(isSupabaseAuthTemplateName("recovery")).toBe(true);
    expect(isSupabaseAuthTemplateName("desconocida")).toBe(false);
  });

  it.each(supabaseAuthTemplateNames)("genera %s como plantilla Go válida y de marca", (templateName) => {
    const html = supabaseAuthEmailTemplate(templateName);

    expect(html).toContain('lang="es"');
    expect(html).toContain("Red Técnicos Chile");
    expect(html).toContain("#1f5f8f");
    expect(html).toContain("#c8ff55");
    expect(html).toContain("{{ .ConfirmationURL }}");
    expect(html).toContain("{{ if .Token }}");
    expect(html).toContain("{{ .Token }}");
    expect(html).not.toContain("example.com");
    expect(supabaseAuthTemplateSubjects[templateName]).toContain("Red Técnicos Chile");
  });

  it("explica que una recuperación no solicitada puede ignorarse", () => {
    const html = supabaseAuthEmailTemplate("recovery");

    expect(html).toContain("Restablece tu contraseña");
    expect(html).toContain("Tu contraseña actual seguirá funcionando");
  });

  it("muestra el nuevo correo solo mediante la variable segura de GoTrue", () => {
    const html = supabaseAuthEmailTemplate("email-change");

    expect(html).toContain("{{ .NewEmail }}");
    expect(html).toContain("Confirma tu nuevo correo");
  });
});
