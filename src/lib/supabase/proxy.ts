import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getPublicSupabaseConfig,
  isSupabaseAuthMode,
  isSupabaseConfigured,
} from "./config";

export async function refreshSupabaseSession(request: NextRequest) {
  if (!isSupabaseAuthMode() || !isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const { url, key } = getPublicSupabaseConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Verifica el JWT y permite que @supabase/ssr rote tokens vencidos.
  await supabase.auth.getClaims();
  return response;
}
