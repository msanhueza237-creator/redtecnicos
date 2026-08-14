import { expect, test } from "@playwright/test";

test("mantiene Supabase cerrado mientras la demo usa fixtures", async ({ page }) => {
  await page.goto("/ingresar");

  await expect(page.getByRole("heading", { name: "Ingresa a tu cuenta" })).toBeVisible();
  await expect(page.getByText("El acceso Supabase está preparado")).toBeVisible();
  await expect(page.getByLabel("Correo electrónico")).toHaveCount(0);
});

test("no descubre administración sin una sesión autorizada", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Administración" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Ingreso profesional" }).first()).toBeVisible();
});
