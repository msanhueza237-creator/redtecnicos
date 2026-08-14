export type AppDataSource = "fixtures" | "supabase";

export function getAppDataSource(): AppDataSource {
  return process.env.APP_DATA_SOURCE === "supabase" ? "supabase" : "fixtures";
}

export function isSupabaseMode(): boolean {
  return getAppDataSource() === "supabase";
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
