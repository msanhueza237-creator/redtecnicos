import { expect, test } from "@playwright/test";

test("el registro breve recorre cuatro etapas y presenta la postulación", async ({ page }) => {
  await page.goto("/registro-tecnico");
  const form = page.locator("form.wizard-shell");

  await expect(page.getByRole("heading", { level: 1, name: "Crea tu perfil profesional" })).toBeVisible();
  await expect(form.getByText("Vista local: no se enviarán datos")).toBeVisible();
  await form.getByLabel("Nombre completo").fill("Técnico Ejemplo");
  await form.getByLabel("Correo electrónico").fill("tecnico@example.com");
  await form.getByLabel("Celular").fill("+56 9 1234 5678");
  await form.getByLabel("Contraseña", { exact: true }).fill("ClaveSegura2026");
  await form.getByLabel("Repetir contraseña").fill("ClaveSegura2026");
  await form.getByRole("button", { name: /Siguiente/ }).click();

  await expect(form.getByRole("heading", { name: "Perfil profesional" })).toBeVisible();
  await form.getByLabel("Nombre que verá el cliente").fill("Clima Técnico Ejemplo");
  await form.getByLabel("Categoría principal").selectOption("residential");
  await form.getByLabel("Años de experiencia").fill("8");
  await form.getByLabel("Presentación profesional").fill("Especialista en instalación, diagnóstico y mantención de climatización residencial.");
  await form.getByRole("button", { name: /Siguiente/ }).click();

  await expect(form.getByRole("heading", { name: "Servicios y cobertura" })).toBeVisible();
  await form.getByLabel("Instalación de aire acondicionado").check();
  await form.getByLabel("Región principal").selectOption("CL-RM");
  await form.getByLabel("Comuna principal").fill("Santiago");
  await form.getByRole("button", { name: /Siguiente/ }).click();

  await expect(form.getByRole("heading", { name: "Revisión y envío" })).toBeVisible();
  await expect(form).toContainText("Clima Técnico Ejemplo");
  await expect(form).toContainText("Santiago");
  await expect(form.getByText(/referencias/i)).toHaveCount(0);
  await form.getByLabel(/Acepto los términos/).check();
  await form.getByRole("button", { name: "Ver ejemplo de envío" }).click();

  await expect(page.getByRole("heading", { name: "Así llegará la postulación al administrador" })).toBeVisible();
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflows).toBe(false);
});
