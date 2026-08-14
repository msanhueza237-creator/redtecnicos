import { expect, test } from "@playwright/test";

test("landing communicates the directory model and offers working navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /El técnico en refrigeración correcto/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tres áreas, una misma red profesional" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Industrial Plantas/i })).toHaveAttribute("href", "/tecnicos?category=industrial");
  await expect(page.getByRole("link", { name: /Comercial Supermercados/i })).toHaveAttribute("href", "/tecnicos?category=commercial");
  await expect(page.getByRole("link", { name: /Residencial Climatización/i })).toHaveAttribute("href", "/tecnicos?category=residential");
  await expect(page.getByRole("link", { name: "Ver directorio completo" })).toHaveAttribute("href", "/tecnicos");
  await expect(page.getByRole("status")).toContainText("Todos los perfiles y datos mostrados son ficticios");
});

test("landing metrics are calculated from fixtures and not zero", async ({ page }) => {
  await page.goto("/");
  const metrics = page.locator(".landing-metrics");
  await expect(metrics).toContainText("10");
  await expect(metrics).toContainText("3");
  await expect(metrics).not.toContainText(/^0$/);
});

test("landing does not use prohibited guarantee language", async ({ page }) => {
  await page.goto("/");
  const text = (await page.locator("body").innerText()).toLocaleLowerCase("es-CL");
  expect(text).not.toContain("técnico garantizado");
  expect(text).not.toContain("nuestros técnicos");
  expect(text).not.toContain("recomendado oficialmente");
});
