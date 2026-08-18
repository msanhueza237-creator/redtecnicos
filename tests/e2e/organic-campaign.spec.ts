import { expect, test } from "@playwright/test";

test("home exposes organic paths only through its subtle footer row", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("navigation", { name: "Servicios y guías útiles" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mantención de aire acondicionado" })).toHaveAttribute(
    "href",
    "/servicios/mantencion-aire-acondicionado",
  );
  await expect(page.getByRole("link", { name: "Cómo elegir un técnico" })).toHaveAttribute(
    "href",
    "/guias/como-elegir-tecnico-refrigeracion-climatizacion",
  );
  await expect(page.getByRole("heading", { name: "Encuentra el perfil adecuado para cada necesidad" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Servicios", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Guías", exact: true })).toHaveCount(0);
});

test("service landing connects search intent with matching profiles", async ({ page }) => {
  await page.goto("/servicios/mantencion-aire-acondicionado");

  await expect(page.getByRole("heading", { level: 1, name: "Técnicos para mantención de aire acondicionado en Chile" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Perfiles que ofrecen mantención de aire acondicionado/i })).toBeVisible();
  await expect(page.locator(".profile-card").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Qué puedes comparar" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Preguntas frecuentes" })).toBeVisible();
  expect(await page.locator('link[rel="canonical"]').getAttribute("href"))
    .toMatch(/\/servicios\/mantencion-aire-acondicionado$/u);
});

test("guide is shareable and leads back to acquisition", async ({ page }) => {
  await page.goto("/guias/como-redactar-solicitud-servicio-tecnico");

  await expect(page.getByRole("heading", { level: 1, name: "Cómo redactar una solicitud de servicio técnico útil" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Compartir esta guía" }).getByRole("link")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Busca un perfil según tu necesidad" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver perfiles" })).toHaveAttribute("href", "/tecnicos");
});

test("non-production review mode stays closed to crawlers", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /");

  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).not.toContain("<url>");
});

test("organic pages do not overflow horizontally", async ({ page }) => {
  test.setTimeout(60_000);

  for (const pathname of [
    "/servicios",
    "/servicios/camaras-de-frio",
    "/guias",
    "/guias/senales-mantencion-aire-acondicionado",
  ]) {
    await page.goto(pathname);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
});
