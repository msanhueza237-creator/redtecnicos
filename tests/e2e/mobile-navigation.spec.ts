import { expect, test, type Page, type TestInfo } from "@playwright/test";

function mobileOnly(testInfo: TestInfo) {
  test.skip(testInfo.project.name !== "mobile", "La barra inferior solo se muestra a 375 px.");
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
}

test("mobile visitors see the anonymous entry without an administrative shortcut", async ({ page }, testInfo) => {
  mobileOnly(testInfo);
  await page.goto("/");

  const navigation = page.getByRole("navigation", { name: "Navegación principal móvil" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Ingresar", exact: true })).toHaveAttribute(
    "href",
    "/acceso-demo",
  );
  await expect(navigation.getByRole("link", { name: "Administrar", exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("mobile technicians receive a direct link to their panel", async ({ page }, testInfo) => {
  mobileOnly(testInfo);
  await page.goto("/acceso-demo");
  await page.getByRole("button", { name: "Entrar como técnico" }).click();
  await expect(page).toHaveURL(/\/panel$/);

  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Navegación principal móvil" });
  await expect(navigation.getByRole("link", { name: "Mi panel", exact: true })).toHaveAttribute("href", "/panel");
  await expect(navigation.getByRole("link", { name: "Administrar", exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("mobile administrators receive the administrative shortcut only after signing in", async ({ page }, testInfo) => {
  mobileOnly(testInfo);
  await page.goto("/acceso-demo/administracion");
  await page.getByRole("button", { name: "Entrar como administrador" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Navegación principal móvil" });
  await expect(navigation.getByRole("link", { name: "Administrar", exact: true })).toHaveAttribute("href", "/admin");
  await expect(navigation.getByRole("link", { name: "Ingresar", exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
