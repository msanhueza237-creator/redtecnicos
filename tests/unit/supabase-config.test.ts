import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAppDataSource,
  getAuthDataSource,
  getPublicSupabaseConfig,
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

  it("prefiere la llave JWT anon en instalaciones self-hosted", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-jwt-compatible");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-incompatible");

    expect(getPublicSupabaseConfig().key).toBe("anon-jwt-compatible");
  });
});
