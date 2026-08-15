import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAppDataSource,
  getAuthDataSource,
  isSupabaseAuthMode,
} from "@/lib/supabase/config";

describe("origen de autenticaciÃ³n", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("conserva el origen de datos como valor predeterminado", () => {
    vi.stubEnv("APP_DATA_SOURCE", "supabase");
    vi.stubEnv("AUTH_DATA_SOURCE", "");

    expect(getAppDataSource()).toBe("supabase");
    expect(getAuthDataSource()).toBe("supabase");
    expect(isSupabaseAuthMode()).toBe(true);
  });

  it("permite Supabase Auth mientras los datos pÃºblicos siguen en fixtures", () => {
    vi.stubEnv("APP_DATA_SOURCE", "fixtures");
    vi.stubEnv("AUTH_DATA_SOURCE", "supabase");

    expect(getAppDataSource()).toBe("fixtures");
    expect(getAuthDataSource()).toBe("supabase");
    expect(isSupabaseAuthMode()).toBe(true);
  });

  it("usa fixtures ante valores no reconocidos", () => {
    vi.stubEnv("APP_DATA_SOURCE", "otro");
    vi.stubEnv("AUTH_DATA_SOURCE", "otro");

    expect(getAppDataSource()).toBe("fixtures");
    expect(getAuthDataSource()).toBe("fixtures");
  });
});
