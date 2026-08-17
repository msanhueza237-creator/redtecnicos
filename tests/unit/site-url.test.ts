import { afterEach, describe, expect, it } from "vitest";
import { getPublicSiteOrigin, publicSiteUrl } from "@/lib/site-url";

const originalAppUrl = process.env.APP_URL;
const originalPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;

  if (originalPublicAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalPublicAppUrl;
});

describe("public site URL", () => {
  it("uses the configured public origin and removes an accidental path", () => {
    process.env.APP_URL = "https://redtecnicos.cl/configuracion/";

    expect(getPublicSiteOrigin()).toBe("https://redtecnicos.cl");
    expect(publicSiteUrl("/seguimiento/token?verification=success"))
      .toBe("https://redtecnicos.cl/seguimiento/token?verification=success");
  });

  it("never exposes the internal Docker bind address", () => {
    process.env.APP_URL = "http://0.0.0.0:3000";
    process.env.NEXT_PUBLIC_APP_URL = "https://redtecnicos.cl";

    expect(getPublicSiteOrigin()).toBe("https://redtecnicos.cl");
  });

  it("falls back to the canonical production domain when configuration is invalid", () => {
    process.env.APP_URL = "not-a-url";
    process.env.NEXT_PUBLIC_APP_URL = "http://[::]:3000";

    expect(getPublicSiteOrigin()).toBe("https://redtecnicos.cl");
  });
});
