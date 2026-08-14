import { expect, test } from "@playwright/test";

test("profile separates review score from customer rating", async ({ page }) => {
  await page.goto("/empresas/climasur-demo-spa");
  await expect(page.getByRole("heading", { level: 1, name: "ClimaSur Demo SpA" })).toBeVisible();
  await expect(page.getByText("Nivel de completitud y revisión")).toBeVisible();
  await expect(page.getByText(/no constituye una garantía/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Solicitar contacto" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Formación y capacitaciones revisadas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trabajos realizados" })).toBeVisible();
  await expect(page.locator(".portfolio-grid img")).toHaveCount(3);
});
