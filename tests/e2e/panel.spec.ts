import { expect, test, type Page, type TestInfo } from "@playwright/test";

const panelRoutes = [
  { href: "/panel", heading: "Resumen de tu perfil" },
  { href: "/panel/perfil", heading: "Mi perfil" },
  { href: "/panel/servicios", heading: "Servicios" },
  { href: "/panel/cobertura", heading: "Cobertura" },
  { href: "/panel/documentos", heading: "Documentos" },
  { href: "/panel/formacion", heading: "Formación" },
  { href: "/panel/galeria", heading: "Galería" },
  { href: "/panel/solicitudes", heading: "Solicitudes" },
  { href: "/panel/evaluaciones", heading: "Evaluaciones" },
  { href: "/panel/configuracion", heading: "Configuración" },
] as const;

async function enterTechnicianPanel(page: Page) {
  await page.goto("/acceso-demo");
  await page.getByRole("button", { name: "Entrar como técnico" }).click();
  await expect(page).toHaveURL(/\/panel$/, { timeout: 30_000 });
}

test("the professional panel exposes real protected routes with active navigation", async ({ page }) => {
  test.setTimeout(90_000);
  await enterTechnicianPanel(page);

  for (const route of panelRoutes) {
    await page.goto(route.href);
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    await expect(page.locator(`.professional-panel-nav a[href="${route.href}"][aria-current="page"]`)).toHaveCount(2);
  }
});

test("the profile form demonstrates an edit without persistence", async ({ page }) => {
  await enterTechnicianPanel(page);
  await page.goto("/panel/perfil");

  await page.getByLabel("Nombre visible").fill("Técnico Austral Demo Actualizado");
  await page.getByRole("button", { name: "Guardar cambios demo" }).click();

  await expect(page.locator(".professional-panel-content").getByRole("status"))
    .toContainText("Cambios aplicados solo en esta demostración");
  await expect(page.getByLabel("Nombre visible")).toHaveValue("Técnico Austral Demo Actualizado");
});

test("a technician can advance a fictitious contact request on screen", async ({ page }) => {
  await enterTechnicianPanel(page);
  await page.goto("/panel/solicitudes");

  const detail = page.locator(".professional-panel-request-detail");
  await expect(detail).toContainText("SOL-DEMO-0004");
  await expect(detail).toContainText("Cliente Demo Cuatro");
  await page.getByRole("button", { name: "Marcar como vista" }).click();

  await expect(detail.getByText("Vista", { exact: true })).toBeVisible();
  await expect(detail.getByRole("status")).toContainText("SOL-DEMO-0004 ahora figura como Vista");
  await expect(detail.getByRole("button", { name: "Registrar contacto demo" })).toBeVisible();
});

test("document and gallery examples never request a real file", async ({ page }) => {
  await enterTechnicianPanel(page);
  await page.goto("/panel/documentos");

  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Simular renovación" }).click();
  await expect(page.locator(".professional-panel-content").getByRole("status"))
    .toContainText("No se cargó ningún archivo");

  await page.goto("/panel/galeria");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.locator(".professional-panel-gallery-item img")).toHaveCount(3);
  await page.getByRole("button", { name: "Retirar" }).first().click();
  await page.getByRole("button", { name: /Agregar trabajo \(2\/5\)/ }).click();
  await expect(page.locator('input[value="Nueva instalación de ejemplo"]')).toBeVisible();
  await expect(page.locator(".professional-panel-content").getByRole("status"))
    .toContainText("No se cargó ningún archivo");

  await page.goto("/panel/formacion");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page.getByLabel("Nombre").fill("Capacitación ficticia E2E");
  await page.getByLabel("Institución").fill("Centro demo E2E");
  await page.getByRole("button", { name: "Agregar en demo" }).click();
  await expect(page.getByText("Capacitación ficticia E2E")).toBeVisible();
});

test("the professional module has no horizontal overflow at 375 px", async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Validación específica del viewport móvil.");
  await enterTechnicianPanel(page);

  for (const href of ["/panel", "/panel/solicitudes", "/panel/documentos"] as const) {
    await page.goto(href);
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  }
});
