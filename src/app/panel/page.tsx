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

export const metadata: Metadata = { title: "Resumen | Panel profesional demo" };

export default function ProfessionalPanelPage() {
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
