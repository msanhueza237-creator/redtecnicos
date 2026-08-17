import { expect, test } from "@playwright/test";

test("el canal público registra un reporte de demostración y entrega un número de caso", async ({ page }) => {
  await page.goto("/reportar");
  await expect(page.getByRole("heading", { level: 1, name: "Reportar un problema" })).toBeVisible();
  await page.getByLabel("Nombre").fill("Cliente Ejemplo");
  await page.getByLabel("Correo electrónico").fill("cliente@example.com");
  await page.getByLabel("Motivo principal").selectOption("professional_conduct");
  await page.getByLabel("Resumen del problema").fill("Incumplimiento del horario acordado");
  await page.getByLabel("Describe lo ocurrido").fill("El profesional no se presentó en el horario confirmado y necesito informar lo ocurrido.");
  await page.getByLabel(/Acepto que Red Técnicos Chile/).check();
  await page.getByRole("button", { name: "Enviar reporte" }).click();

  await expect(page.getByRole("heading", { name: /REC-DEMO-0001/ })).toBeVisible({ timeout: 30_000 });
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
