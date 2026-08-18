import { expect, test } from "@playwright/test";

test("landing communicates the directory model and offers working navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /El técnico en refrigeración correcto/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tres áreas, una misma red profesional" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Decide con información antes de contratar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorar el directorio" })).toHaveAttribute("href", "/tecnicos");
  await expect(page.getByRole("link", { name: /Industrial Plantas/i })).toHaveAttribute("href", "/tecnicos?category=industrial");
  await expect(page.getByRole("link", { name: /Comercial Supermercados/i })).toHaveAttribute("href", "/tecnicos?category=commercial");
  await expect(page.getByRole("link", { name: /Residencial Climatización/i })).toHaveAttribute("href", "/tecnicos?category=residential");
  await expect(page.getByRole("link", { name: "Ver directorio completo" })).toHaveAttribute("href", "/tecnicos");
  await expect(page.getByRole("heading", { name: "Experiencias de clientes verificados" })).toBeVisible();
  await expect(page.getByText("Opiniones de demostración")).toBeVisible();
  await expect(page.getByText("Cliente ficticio").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver técnicos mejor evaluados" })).toHaveAttribute("href", "/tecnicos?sort=rating");
  await expect(page.getByRole("status")).toContainText("Todos los perfiles y datos mostrados son ficticios");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("landing metrics are calculated from fixtures and not zero", async ({ page }) => {
  await page.goto("/");
  const metrics = page.locator(".landing-metrics");
  await expect(metrics.locator("strong")).toHaveText(["10", "29", "149", "4.8"]);
  await expect(metrics).toContainText("Evaluaciones demo");
});

test("published profile cards preview up to three approved works", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator(".profile-card");
  await expect(cards).toHaveCount(6);
  await expect(cards.first().locator(".profile-card-gallery-image")).toHaveCount(3);
  await expect(cards.first().locator(".profile-card-gallery-label")).toContainText("3 trabajos destacados");
});

test("landing does not use prohibited guarantee language", async ({ page }) => {
  await page.goto("/");
  const text = (await page.locator("body").innerText()).toLocaleLowerCase("es-CL");
  expect(text).not.toContain("técnico garantizado");
  expect(text).not.toContain("nuestros técnicos");
  expect(text).not.toContain("recomendado oficialmente");
});
