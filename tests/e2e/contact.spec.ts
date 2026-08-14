import { expect, test } from "@playwright/test";

interface ContactResponse {
  data?: {
    requestId: string;
    trackingToken: string;
    professional: {
      displayName: string;
      email: string;
      phone: string;
    };
  };
}

test("the customer receives contact details immediately and the private admin history captures the request", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);

  const suffix = testInfo.project.name.replace(/\W/g, "-");
  const customerName = `Cliente E2E ${suffix}`;
  const customerEmail = `cliente-${suffix}@example.test`;
  const customerPhone = "+56 9 0000 0099";
  const service = "Instalación de aire acondicionado";

  await page.goto("/empresas/climasur-demo-spa#contacto");
  await page.getByLabel("Nombre").fill(customerName);
  await page.getByLabel("Correo electrónico").fill(customerEmail);
  await page.getByLabel("Celular").fill(customerPhone);
  await page.getByLabel("Comuna").selectOption("Puerto Montt");
  await page.getByLabel("Servicio requerido").selectOption(service);
  await page.getByLabel("¿Qué necesitas?").fill("Instalar un equipo de demostración en el living del domicilio.");
  await page.getByLabel(/Acepto el tratamiento de mis datos/).check();

  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/v1/contact-requests") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Ver datos de contacto" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);

  const payload = (await response.json()) as ContactResponse;
  const result = payload.data;
  expect(result?.requestId).toMatch(/^SOL-[0-9A-F]{12}$/);
  expect(result?.trackingToken).toBeTruthy();

  await expect(page.getByRole("heading", { name: "Ya puedes contactar a ClimaSur Demo SpA" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Correo electrónico/ })).toContainText(result!.professional.email);
  await expect(page.getByRole("link", { name: /Celular/ })).toContainText(result!.professional.phone);
  await expect(page.getByText(result!.requestId, { exact: true })).toBeVisible();
  await expect(page.getByText(result!.trackingToken, { exact: true })).toHaveCount(0);

  const trackingLink = page.getByRole("link", { name: "Seguir solicitud y evaluar después" });
  await expect(trackingLink).toHaveAttribute("href", `/seguimiento/${result!.trackingToken}`);
  await trackingLink.click();
  await expect(page).toHaveURL(new RegExp(`/seguimiento/${result!.trackingToken}$`));
  await expect(page.getByRole("heading", { name: "Tu solicitud a ClimaSur Demo SpA" })).toBeVisible();
  await expect(page.getByText(result!.requestId, { exact: true }).first()).toBeVisible();

  await page.getByLabel(/Confirmo que ClimaSur Demo SpA realizó el trabajo/).check();
  await page.getByRole("button", { name: "Confirmar trabajo y calificar" }).click();
  await expect(page.getByRole("heading", { name: "¿Cómo fue el trabajo?" })).toBeVisible();

  await page.getByRole("radio", { name: "5" }).check();
  await page.getByRole("radio", { name: "Sí, lo recomendaría" }).check();
  await page.getByLabel("Comentario sobre el trabajo").fill("Excelente trabajo de demostración: llegó a la hora y explicó claramente la instalación.");
  await page.getByLabel(/Confirmo que esta evaluación corresponde al trabajo/).check();
  await page.getByRole("button", { name: "Enviar evaluación" }).click();
  await expect(page.getByRole("heading", { name: "Gracias por compartir tu experiencia" })).toBeVisible();
  await expect(page.getByText("Estado: pendiente de moderación. No se publicará automáticamente.")).toBeVisible();

  await page.goto("/acceso-demo/administracion");
  await page.getByRole("button", { name: "Entrar como administrador" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("link", { name: "Solicitudes", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/solicitudes$/);

  const requestRow = page.locator("tr", { hasText: result!.requestId });
  await expect(requestRow).toBeVisible();
  await expect(requestRow).toContainText(customerName);
  await expect(requestRow).toContainText(customerEmail);
  await expect(requestRow).toContainText(customerPhone);
  await expect(requestRow).toContainText(service);
  await expect(requestRow).toContainText("ClimaSur Demo SpA");
  await expect(page.getByText(result!.trackingToken, { exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "Evaluaciones", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/evaluaciones$/);
  const reviewRow = page.locator("tr", { hasText: result!.requestId });
  await expect(reviewRow).toBeVisible();
  await expect(reviewRow).toContainText(customerName);
  await expect(reviewRow).toContainText("ClimaSur Demo SpA");
  await expect(reviewRow).toContainText("5/5");
  await expect(reviewRow).toContainText("Pendiente");
  await expect(page.getByText(result!.trackingToken, { exact: true })).toHaveCount(0);
});
