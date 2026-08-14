import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ChevronRight, FileSearch, Handshake, Search, Send, ShieldCheck, UserPlus } from "lucide-react";

export const metadata: Metadata = { title: "Cómo funciona" };

export default function HowItWorksPage() {
  return (
    <>
      <header className="page-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación"><Link href="/">Inicio</Link><ChevronRight size={13} aria-hidden="true" /><span aria-current="page">Cómo funciona</span></nav>
          <span className="eyebrow">Directorio, no marketplace</span>
          <h1>Información clara antes del contacto</h1>
          <p>Red Técnicos Chile facilita que clientes y profesionales se encuentren, manteniendo la contratación fuera de la plataforma.</p>
        </div>
      </header>
      <section className="section">
        <div className="container audience-columns">
          <article className="audience-card">
            <span className="icon-box"><Search size={22} aria-hidden="true" /></span>
            <span className="eyebrow">Para clientes</span>
            <h2>Busca con más contexto</h2>
            <ol className="timeline-list">
              <li><span>1</span><div><strong>Filtra perfiles</strong><p>Ubicación, servicio, experiencia e información revisada.</p></div></li>
              <li><span>2</span><div><strong>Compara antecedentes</strong><p>Revisa cobertura, trabajos ficticios y señales de verificación.</p></div></li>
              <li><span>3</span><div><strong>Solicita y recibe el contacto</strong><p>Ingresa tus datos, acepta el aviso y recibe inmediatamente el correo y celular autorizado del profesional.</p></div></li>
              <li><span>4</span><div><strong>Acuerda directamente</strong><p>Presupuesto, pago, ejecución y garantía se conversan con el profesional.</p></div></li>
              <li><span>5</span><div><strong>Evalúa el trabajo</strong><p>Usa el enlace privado, confirma que el servicio terminó y envía una sola evaluación sujeta a moderación.</p></div></li>
            </ol>
            <Link className="button button-primary" href="/tecnicos">Explorar directorio</Link>
          </article>
          <article className="audience-card">
            <span className="icon-box"><UserPlus size={22} aria-hidden="true" /></span>
            <span className="eyebrow">Para profesionales</span>
            <h2>Presenta tu experiencia</h2>
            <ol className="timeline-list">
              <li><span>1</span><div><strong>Regístrate voluntariamente</strong><p>Crea tu propia cuenta y acepta los términos vigentes.</p></div></li>
              <li><span>2</span><div><strong>Completa tu perfil</strong><p>Selecciona servicios, cobertura y datos que autorizas publicar.</p></div></li>
              <li><span>3</span><div><strong>Envía antecedentes</strong><p>La documentación privada se revisará sin publicarse completa.</p></div></li>
              <li><span>4</span><div><strong>Recibe solicitudes</strong><p>Decide si deseas responder; no existe comisión por trabajo.</p></div></li>
            </ol>
            <Link className="button button-primary" href="/registro-tecnico">Ver registro de ejemplo</Link>
          </article>
        </div>
      </section>
      <section className="section section-subtle">
        <div className="container">
          <div className="section-header"><div><span className="eyebrow">Qué significan las señales</span><h2>Revisión no significa garantía</h2><p>Los textos se diseñan para describir hechos verificables sin crear una promesa sobre el resultado del servicio.</p></div></div>
          <div className="trust-grid">
            {[
              [BadgeCheck, "Identidad revisada", "Indica que se presentó un documento y fue revisado en una fecha."],
              [FileSearch, "Formación revisada", "Informa que se revisó el respaldo de un título o capacitación; el archivo completo sigue siendo privado."],
              [ShieldCheck, "Evaluación vinculada", "Solo podrá publicarse después de una solicitud válida y completada."],
              [Handshake, "Contacto directo", "Red Técnicos Chile no fija precios, recibe pagos ni supervisa el trabajo."],
            ].map(([Icon, title, text]) => {
              const CardIcon = Icon as typeof Send;
              return <article className="trust-card" key={title as string}><span className="icon-box"><CardIcon size={22} aria-hidden="true" /></span><h3>{title as string}</h3><p>{text as string}</p></article>;
            })}
          </div>
        </div>
      </section>
    </>
  );
}
