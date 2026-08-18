import { expect, test, type TestInfo } from "@playwright/test";

test("profile prioritizes published work without exposing an internal score", async ({ page }) => {
  await page.goto("/empresas/climasur-demo-spa");
  await expect(page.getByRole("heading", { level: 1, name: "ClimaSur Demo SpA" })).toBeVisible();
  await expect(page.getByText("Nivel de completitud y revisión")).toHaveCount(0);
  await expect(page.getByText(/no constituye una garantía/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Solicitar contacto" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Formación y capacitaciones revisadas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conoce parte de su experiencia" })).toBeVisible();
  await expect(page.locator(".portfolio-grid img")).toHaveCount(3);
});

test("mobile profile keeps contact one tap away without horizontal overflow", async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Validación específica del perfil a 375 px.");
  await page.goto("/empresas/climasur-demo-spa");
  await expect(page.locator(".profile-mobile-contact-cta")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
