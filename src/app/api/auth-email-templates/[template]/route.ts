import {
  isSupabaseAuthTemplateName,
  supabaseAuthEmailTemplate,
} from "@/lib/email/supabase-auth-templates";

export async function GET(
  _request: Request,
  context: { params: Promise<{ template: string }> },
) {
  const { template } = await context.params;

  if (!isSupabaseAuthTemplateName(template)) {
    return new Response("Plantilla no encontrada", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  return new Response(supabaseAuthEmailTemplate(template), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
