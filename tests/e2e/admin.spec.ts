import { expect, test, type Page } from "@playwright/test";

const adminSections = [
  { href: "/admin", label: "Dashboard", heading: "Resumen de moderación" },
  { href: "/admin/postulaciones", label: "Postulaciones", heading: "Postulaciones" },
  { href: "/admin/profesionales", label: "Profesionales", heading: "Profesionales" },
  { href: "/admin/documentos", label: "Documentos", heading: "Documentos" },
  { href: "/admin/galerias", label: "Galerías", heading: "Galerías" },
  { href: "/admin/solicitudes", label: "Solicitudes", heading: "Solicitudes de contacto" },
  { href: "/admin/evaluaciones", label: "Evaluaciones", heading: "Evaluaciones" },
  { href: "/admin/reclamos", label: "Reclamos", heading: "Reclamos" },
  { href: "/admin/estadisticas", label: "Estadísticas", heading: "Estadísticas" },
  { href: "/admin/contenido", label: "Contenido", heading: "Contenido público" },
  { href: "/admin/auditoria", label: "Auditoría", heading: "Auditoría" },
  { href: "/admin/configuracion", label: "Configuración", heading: "Configuración" },
] as const;

async function enterAs(page: Page, role: "administrador" | "técnico") {
  await page.goto(role === "administrador" ? "/acceso-demo/administracion" : "/acceso-demo");
  await page.getByRole("button", { name: `Entrar como ${role}` }).click();
  await expect(page).toHaveURL(role === "técnico" ? /\/panel$/ : /\/admin$/, {
    timeout: 30_000,
  });
}

test("the public demo access only presents the technician panel", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('.site-header a[href="/admin"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Administración", exact: true })).toHaveCount(0);

  const desktopAccess = page.locator(".desktop-nav").getByRole("link", { name: "Ingreso profesional" });
  if (await desktopAccess.isVisible()) {
    await desktopAccess.click();
  } else {
    await page.locator("summary[aria-label='Abrir menú']").click();
    await page.locator(".mobile-menu-panel").getByRole("link", { name: "Ingreso profesional" }).click();
  }

  await expect(page).toHaveURL(/\/acceso-demo$/);
  await expect(page.getByRole("heading", { level: 1, name: "Revisa la experiencia del técnico" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar como técnico" })).toBeVisible();
  await expect(page.getByRole("button", { name: /administrador|moderador/i })).toHaveCount(0);
  await expect(page.locator('a[href="/acceso-demo/administracion"]')).toHaveCount(0);
});

test("the direct administrative demo entry offers one administrator profile", async ({ page }) => {
  await page.goto("/acceso-demo/administracion");

  await expect(page.getByRole("heading", { level: 1, name: "Administración de la plataforma" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar como administrador" })).toBeVisible();
  await expect(page.getByRole("button", { name: /moderador|superadministrador|técnico/i })).toHaveCount(0);
});

test("an anonymous visitor is redirected to the direct admin entry before admin renders", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/acceso-demo\/administracion\?next=%2Fadmin$/);
  await expect(page.locator(".admin-shell")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Entrar como administrador" })).toBeVisible();
});

test("the administrator opens the isolated shell and sees all sections", async ({ page }) => {
  await enterAs(page, "administrador");

  await expect(page.locator(".admin-shell")).toBeVisible();
  await expect(page.locator(".admin-topbar")).toContainText("Sesión demo");
  await expect(page.locator(".admin-session strong")).toHaveText("Administrador");
  await expect(page.getByRole("navigation", { name: "Secciones administrativas" }).locator(".admin-nav-link"))
    .toHaveCount(adminSections.length);
  await expect(page.locator(".site-header")).toHaveCount(0);
  await expect(page.locator(".site-footer")).toHaveCount(0);

  await page.goto("/");
  await expect(page.locator('.site-header a[href="/admin"]').first()).toHaveText("Administración");
  await expect(page.locator('.site-header a[href="/acceso-demo"]')).toHaveCount(0);
});

test("a technician session cannot enter the administrative area", async ({ page }) => {
  await enterAs(page, "técnico");
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/acceso-demo\/administracion\?next=%2Fadmin$/);
  await expect(page.locator(".admin-shell")).toHaveCount(0);
});

test("all administrative sections are real routes with an active navigation state", async ({ page }) => {
  test.setTimeout(120_000);
  await enterAs(page, "administrador");
  const navigation = page.getByRole("navigation", { name: "Secciones administrativas" });

  for (const section of adminSections) {
    const link = navigation.getByRole("link", { name: section.label, exact: true });
    await expect(link).toHaveAttribute("href", section.href);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${section.href.replaceAll("/", "\\/")}$`), {
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { level: 1, name: section.heading })).toBeVisible({
      timeout: 30_000,
    });
    await expect(link).toHaveAttribute("aria-current", "page");
  }
});

test("signing out returns to the non-public administrative entry and revokes access", async ({ page }) => {
  await enterAs(page, "administrador");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();

  await expect(page).toHaveURL(/\/acceso-demo\/administracion\?logout=1$/);
  await expect(page.locator(".legal-note[role='status']")).toContainText("se cerró correctamente");

  await page.goto("/admin/documentos");
  await expect(page).toHaveURL(/\/acceso-demo\/administracion\?next=%2Fadmin$/);
});

test("the admin shell keeps horizontal tables contained on narrow screens", async ({ page }) => {
  await enterAs(page, "administrador");
  await page.goto("/admin/postulaciones");

  await expect(page.locator(".admin-sidebar")).toBeVisible();
  await expect(page.locator(".admin-table-scroll")).toBeVisible();
  const hasPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasPageOverflow).toBe(false);
});
