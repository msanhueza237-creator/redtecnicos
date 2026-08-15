export type AppDataSource = "fixtures" | "supabase";
export type AuthDataSource = "fixtures" | "supabase";

export function getAppDataSource(): AppDataSource {
  return process.env.APP_DATA_SOURCE === "supabase" ? "supabase" : "fixtures";
}

export function isSupabaseMode(): boolean {
  return getAppDataSource() === "supabase";
}

/**
 * Permite activar Supabase Auth antes de migrar todos los mÃ³dulos pÃºblicos.
 * Si AUTH_DATA_SOURCE no estÃ¡ definido se conserva el comportamiento anterior.
 */
export function getAuthDataSource(): AuthDataSource {
  if (process.env.AUTH_DATA_SOURCE === "supabase") return "supabase";
  if (process.env.AUTH_DATA_SOURCE === "fixtures") return "fixtures";
  return getAppDataSource();
}

export function isSupabaseAuthMode(): boolean {
  return getAuthDataSource() === "supabase";
}

export interface PublicSupabaseConfig {
  url: string;
  key: string;
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error(
      "Supabase requiere NEXT_PUBLIC_SUPABASE_URL y una llave publicable/anon.",
    );
  }

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  try {
    getPublicSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}
