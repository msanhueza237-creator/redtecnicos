import { expect, test } from "@playwright/test";

test("health endpoint exposes only the documented fields", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  const payload = await response.json();
  expect(Object.keys(payload).sort()).toEqual(["buildDate", "connection", "email", "status", "version"]);
  expect(payload).toEqual(expect.objectContaining({ status: "ok", connection: "fixtures", email: "missing" }));
});
