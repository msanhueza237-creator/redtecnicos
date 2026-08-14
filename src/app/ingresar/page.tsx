import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured, isSupabaseMode } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Ingreso seguro",
  description: "Ingreso para técnicos, empresas y administración de Red Técnicos Chile.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = first(params.next);
  const registered = first(params.registro) === "confirmar-correo";
  const loggedOut = first(params.logout) === "1";
  const ready = isSupabaseMode() && isSupabaseConfigured();

  return (
    <>
      <header className="page-hero compact-hero">
        <div className="container">
          <span className="eyebrow">Acceso protegido por Supabase Auth</span>
          <h1>Ingresa a tu cuenta</h1>
          <p>Un único acceso seguro dirige a cada persona a su panel según el rol asignado.</p>
        </div>
      </header>
      <section className="section section-subtle">
        <div className="container auth-layout">
          <article className="auth-card">
            <div className="auth-card-heading">
              <span className="icon-box"><ShieldCheck aria-hidden="true" size={22} /></span>
              <div>
                <h2>Técnicos y administración</h2>
                <p>La opción Administración solo aparecerá después de validar una cuenta autorizada.</p>
              </div>
            </div>
            {registered && <p className="auth-message" data-status="success" role="status">Cuenta creada. Revisa tu correo y confirma el enlace antes de ingresar.</p>}
            {loggedOut && <p className="auth-message" data-status="success" role="status">La sesión se cerró correctamente.</p>}
            {ready ? (
              <LoginForm nextPath={nextPath} />
            ) : (
              <div className="legal-note" role="status">
                <ShieldCheck aria-hidden="true" size={20} />
                <p>El acceso Supabase está preparado, pero todavía no está habilitado en este entorno. La demo continúa disponible.</p>
              </div>
            )}
            <p className="auth-card-footer">¿Aún no tienes cuenta? <Link href="/registro-tecnico">Publica tu perfil profesional</Link>.</p>
          </article>
        </div>
      </section>
    </>
  );
}
