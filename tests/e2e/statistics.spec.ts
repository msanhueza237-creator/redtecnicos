import { expect, test } from "@playwright/test";

test("administrators can explore privacy-safe operational statistics by period", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/acceso-demo/administracion");
  await page.getByRole("button", { name: "Entrar como administrador" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });

  await page.goto("/admin/estadisticas?period=90");
  await expect(page.getByRole("heading", { level: 1, name: "Estadísticas" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Período estadístico" })).toBeVisible();
  await expect(page.getByRole("link", { name: "90 días" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Indicadores agregados desde Supabase.")).toHaveCount(0);
  await expect(page.getByText(/Los indicadores de esta vista son ficticios/)).toBeVisible();

  const requestsMetric = page.locator(".admin-statistics-metrics article", { hasText: "Solicitudes recibidas" });
  await expect(requestsMetric.locator("strong")).not.toHaveText("0");
  await expect(page.getByRole("list", { name: "Solicitudes agrupadas cronológicamente" }).locator("li")).toHaveCount(12);

  await page.getByRole("link", { name: "7 días" }).click();
  await expect(page).toHaveURL(/\/admin\/estadisticas\?period=7$/);
  await expect(page.getByRole("link", { name: "7 días" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("list", { name: "Solicitudes agrupadas cronológicamente" }).locator("li")).toHaveCount(7);
  await expect(page.getByText("Visitas al directorio")).toHaveCount(0);

  const hasPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasPageOverflow).toBe(false);
});
