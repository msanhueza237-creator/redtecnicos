import { expect, test } from "@playwright/test";

test("directory renders ten labeled demo profiles", async ({ page }) => {
  await page.goto("/tecnicos");
  await expect(page.getByRole("heading", { level: 2, name: "10 perfiles de ejemplo" })).toBeVisible();
  await expect(page.getByText("Perfil de demostración", { exact: true })).toHaveCount(10);
});

test("directory combines a region filter and clears it", async ({ page }) => {
  await page.goto("/tecnicos");
  const mobileFilterButton = page.getByRole("button", { name: /^Filtros/ });
  if (await mobileFilterButton.isVisible()) await mobileFilterButton.click();
  await page.getByLabel("Región").selectOption({ label: "Los Lagos" });
  await expect(page.getByRole("heading", { level: 2, name: "1 perfiles de ejemplo" })).toBeVisible();
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "10 perfiles de ejemplo" })).toBeVisible();
});

test("directory has no horizontal overflow", async ({ page }) => {
  await page.goto("/tecnicos");
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
