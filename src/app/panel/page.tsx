import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CircleGauge,
  Eye,
  FileBadge,
  FileClock,
  FolderCheck,
  Images,
  Inbox,
} from "lucide-react";
import {
  PanelActionLink,
  PanelDemoNotice,
  ProfessionalPanelHeader,
} from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { getAppSession } from "@/lib/auth/session";
import { isSupabaseMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Resumen | Panel profesional" };

interface RealProfileRow {
  id: string;
  slug: string | null;
  display_name: string;
  status: "draft" | "submitted" | "under_review" | "changes_requested" | "approved" | "verified" | "suspended" | "rejected" | "deleted" | "expired_documents";
  review_reason: string | null;
  summary: string;
  categories: string[];
  services: string[];
  commune_codes: string[];
  submitted_at: string | null;
}

const panelStatus = {
  draft: { label: "Borrador", className: "is-neutral", copy: "Completa los datos mínimos y envía el perfil." },
  submitted: { label: "Enviado", className: "is-new", copy: "Tu postulación está esperando revisión administrativa." },
  under_review: { label: "En revisión", className: "is-new", copy: "La administración está revisando tus antecedentes." },
  changes_requested: { label: "Cambios solicitados", className: "is-warning", copy: "Revisa el motivo y corrige la información indicada." },
  approved: { label: "Publicado", className: "is-approved", copy: "Tu perfil ya está disponible en el directorio público." },
  verified: { label: "Verificado", className: "is-approved", copy: "Tu perfil publicado cuenta con señales verificadas." },
  suspended: { label: "Suspendido", className: "is-warning", copy: "El perfil no está visible. Contacta a la administración." },
  rejected: { label: "Rechazado", className: "is-warning", copy: "La postulación no fue aprobada. Revisa el motivo informado." },
  deleted: { label: "Eliminado", className: "is-warning", copy: "El perfil se encuentra eliminado." },
  expired_documents: { label: "Documentos vencidos", className: "is-warning", copy: "Actualiza los documentos indicados para recuperar el estado." },
} as const;

export default async function ProfessionalPanelPage() {
  const session = await getAppSession();
  if (session?.source === "supabase" && session.userId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("professional_profiles")
      .select("id, slug, display_name, status, review_reason, summary, categories, services, commune_codes, submitted_at")
      .eq("owner_user_id", session.userId)
      .maybeSingle();
    const profile = data as RealProfileRow | null;

    if (profile) {
      const [{ count: qualificationCount }, { count: portfolioCount }, { count: requestCount }, { data: directory }] = await Promise.all([
        supabase.from("qualifications").select("id", { count: "exact", head: true }).eq("profile_id", profile.id),
        supabase.from("portfolio_items").select("id", { count: "exact", head: true }).eq("profile_id", profile.id),
        supabase.from("contact_requests").select("id", { count: "exact", head: true }).eq("professional_profile_id", profile.id),
        supabase.from("directory_profiles").select("slug, score").eq("profile_id", profile.id).maybeSingle(),
      ]);
      const status = panelStatus[profile.status];
      const completenessSignals = [profile.summary.length >= 40, profile.categories.length > 0, profile.services.length > 0, profile.commune_codes.length > 0];
      const completeness = Math.round((completenessSignals.filter(Boolean).length / completenessSignals.length) * 100);
      const publicSlug = isSupabaseMode() ? (directory as null | { slug: string; score: number })?.slug : undefined;

      return (
        <>
          <ProfessionalPanelHeader
            title={`Hola, ${profile.display_name}`}
            description="Revisa el estado de tu postulación y completa opcionalmente los antecedentes que generan más confianza."
            actions={<PanelActionLink href="/panel/perfil">Editar perfil</PanelActionLink>}
          />
          <div className="professional-panel-metrics" aria-label="Indicadores reales del perfil">
            <article className="professional-panel-metric"><CircleGauge aria-hidden="true" size={21} /><span>Completitud inicial</span><strong>{completeness}%</strong><small>Datos mínimos del perfil</small></article>
            <article className="professional-panel-metric"><Inbox aria-hidden="true" size={21} /><span>Solicitudes recibidas</span><strong>{requestCount ?? 0}</strong><small>Historial asociado al perfil</small></article>
            <article className="professional-panel-metric"><Images aria-hidden="true" size={21} /><span>Trabajos en galería</span><strong>{portfolioCount ?? 0}/3</strong><small>Opcionales y sujetos a revisión</small></article>
            <article className="professional-panel-metric"><FileBadge aria-hidden="true" size={21} /><span>Formación declarada</span><strong>{qualificationCount ?? 0}</strong><small>Títulos o capacitaciones</small></article>
          </div>
          <div className="professional-panel-grid is-wide">
            <article className="professional-panel-card">
              <div className="professional-panel-card-header"><div><h2>Estado de la postulación</h2><p>{status.copy}</p></div><span className={`professional-panel-status ${status.className}`}>{status.label}</span></div>
              <div className="professional-panel-card-body">
                <div className="professional-panel-progress" role="progressbar" aria-label="Completitud del registro" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completeness}><span style={{ width: `${completeness}%` }} /></div>
                <ul className="professional-panel-checklist"><li><FolderCheck aria-hidden="true" size={17} /> Cuenta y contacto registrados</li><li><FolderCheck aria-hidden="true" size={17} /> Servicios y cobertura enviados</li><li><BellRing aria-hidden="true" size={17} /> Publicación sujeta a revisión administrativa</li></ul>
                {profile.review_reason ? <div className="responsibility-box" style={{ marginTop: 18 }}><BellRing aria-hidden="true" size={17} /><p><strong>Motivo de administración:</strong> {profile.review_reason}</p></div> : null}
              </div>
              {publicSlug ? <div className="professional-panel-card-footer"><Link href={`/tecnicos/${publicSlug}`}>Ver perfil público</Link></div> : null}
            </article>
            <article className="professional-panel-card">
              <div className="professional-panel-card-header"><div><h2>Próximos pasos opcionales</h2><p>No bloquean la postulación inicial.</p></div></div>
              <div className="professional-panel-list">
                <Link className="professional-panel-list-item" href="/panel/galeria"><Images aria-hidden="true" size={20} /><div><strong>Galería de trabajos</strong><span className="professional-panel-list-meta">Agrega hasta tres imágenes con título y descripción.</span></div></Link>
                <Link className="professional-panel-list-item" href="/panel/formacion"><FileBadge aria-hidden="true" size={20} /><div><strong>Formación y capacitaciones</strong><span className="professional-panel-list-meta">Declara antecedentes y adjunta respaldos privados.</span></div></Link>
                <Link className="professional-panel-list-item" href="/panel/documentos"><FileClock aria-hidden="true" size={20} /><div><strong>Documentos</strong><span className="professional-panel-list-meta">Gestiona archivos que requieran revisión.</span></div></Link>
              </div>
            </article>
          </div>
        </>
      );
    }
  }

  const { requests, summary } = demoProfessionalPanel;

  return (
    <>
      <ProfessionalPanelHeader
        title="Resumen de tu perfil"
        description="Revisa el avance del perfil, las solicitudes recibidas y los próximos pasos."
        actions={<PanelActionLink href="/panel/perfil">Editar perfil</PanelActionLink>}
      />
      <PanelDemoNotice />

      <div className="professional-panel-metrics" aria-label="Indicadores ficticios del perfil">
        <article className="professional-panel-metric">
          <CircleGauge aria-hidden="true" size={21} />
          <span>Nivel de revisión</span>
          <strong>{summary.profileScore}/100</strong>
          <small>Calculado con señales aprobadas</small>
        </article>
        <article className="professional-panel-metric">
          <Eye aria-hidden="true" size={21} />
          <span>Visitas del mes</span>
          <strong>{summary.monthlyViews}</strong>
          <small>Indicador de ejemplo</small>
        </article>
        <article className="professional-panel-metric">
          <Inbox aria-hidden="true" size={21} />
          <span>Solicitudes nuevas</span>
          <strong>{summary.newRequests}</strong>
          <small>Datos ficticios disponibles</small>
        </article>
        <article className="professional-panel-metric">
          <FileClock aria-hidden="true" size={21} />
          <span>Documento por vencer</span>
          <strong>{summary.documentsExpiringSoon}</strong>
          <small>Revisión sugerida en 45 días</small>
        </article>
      </div>

      <section className="professional-panel-completion" aria-labelledby="profile-completion-title">
        <div className="professional-panel-completion-header">
          <div>
            <span className="professional-panel-eyebrow">Opcional · puedes hacerlo después</span>
            <h2 id="profile-completion-title">Completa tu perfil cuando quieras</h2>
            <p>Tu registro inicial ya contiene lo indispensable. Estas mejoras ayudan a generar más confianza, pero no bloquean el envío a revisión.</p>
          </div>
          <span className="professional-panel-status is-approved">Registro breve completado</span>
        </div>
        <div className="professional-panel-completion-grid">
          <Link className="professional-panel-completion-item" href="/panel/galeria">
            <span className="professional-panel-completion-icon"><Images aria-hidden="true" size={21} /></span>
            <span>
              <strong>Galería de trabajos</strong>
              <small>Agrega fotografías autorizadas de instalaciones o mantenciones realizadas.</small>
              <span>Gestionar galería <ArrowRight aria-hidden="true" size={15} /></span>
            </span>
          </Link>
          <Link className="professional-panel-completion-item" href="/panel/formacion">
            <span className="professional-panel-completion-icon"><FileBadge aria-hidden="true" size={21} /></span>
            <span>
              <strong>Formación y capacitaciones</strong>
              <small>Declara títulos o capacitaciones y envía su respaldo a revisión privada.</small>
              <span>Gestionar formación <ArrowRight aria-hidden="true" size={15} /></span>
            </span>
          </Link>
        </div>
      </section>

      <div className="professional-panel-grid is-wide">
        <article className="professional-panel-card">
          <div className="professional-panel-card-header">
            <div>
              <h2>Estado del perfil</h2>
              <p>Última versión ficticia publicada.</p>
            </div>
            <span className="professional-panel-status is-approved">Aprobado</span>
          </div>
          <div className="professional-panel-card-body">
            <div
              className="professional-panel-progress"
              role="progressbar"
              aria-label="Nivel de revisión"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.profileScore}
            >
              <span style={{ width: `${summary.profileScore}%` }} />
            </div>
            <ul className="professional-panel-checklist">
              <li><FolderCheck aria-hidden="true" size={17} /> Información principal completa</li>
              <li><FolderCheck aria-hidden="true" size={17} /> Cobertura y servicios definidos</li>
              <li><BellRing aria-hidden="true" size={17} /> Un certificado requiere renovación</li>
            </ul>
          </div>
          <div className="professional-panel-card-footer">
            <Link href="/panel/documentos">Revisar documentos</Link>
            <Link href="/tecnicos/tecnico-austral-ejemplo">Ver perfil público</Link>
          </div>
        </article>

        <article className="professional-panel-card">
          <div className="professional-panel-card-header">
            <div>
              <h2>Solicitudes recientes</h2>
              <p>Clientes y necesidades completamente ficticios.</p>
            </div>
            <Link href="/panel/solicitudes">Ver todas</Link>
          </div>
          <div className="professional-panel-list">
            {requests.slice(0, 3).map((request) => (
              <div className="professional-panel-list-item" key={request.id}>
                <span className={`professional-panel-status ${request.status === "new" ? "is-new" : request.status === "accepted" ? "is-approved" : "is-neutral"}`}>
                  {request.status === "new" ? "Nueva" : request.status === "accepted" ? "Aceptada" : "Vista"}
                </span>
                <div>
                  <strong>{request.service} · {request.customer.commune}</strong>
                  <span className="professional-panel-list-meta">{request.id} · Perfil ficticio</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </>
  );
}
