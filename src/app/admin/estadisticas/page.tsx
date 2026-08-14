import type { Metadata } from "next";
import { Eye, Inbox, Star, UserRoundCheck } from "lucide-react";
import { AdminCard, AdminDemoNotice, AdminPageHeading } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Estadísticas | Administración demo" };

const regions = [
  { label: "Metropolitana", value: 82 },
  { label: "Valparaíso", value: 58 },
  { label: "Biobío", value: 46 },
  { label: "Los Lagos", value: 37 },
] as const;

const services = [
  { label: "Instalación", value: 74 },
  { label: "Mantención", value: 62 },
  { label: "Diagnóstico", value: 41 },
  { label: "Refrigeración", value: 29 },
] as const;

export default function StatisticsPage() {
  return (
    <section className="admin-page">
      <AdminPageHeading title="Estadísticas" description="Indicadores operacionales ficticios para evaluar la futura lectura ejecutiva del directorio." />
      <AdminDemoNotice>Estos valores no provienen de analítica ni de actividad real y excluyen conceptualmente los perfiles demo de cualquier métrica productiva.</AdminDemoNotice>
      <div className="metric-grid">
        <article><span className="metric-icon"><Eye aria-hidden="true" size={20} /></span><span>Visitas al directorio</span><strong>3.482</strong><small>Últimos 30 días · demo</small></article>
        <article><span className="metric-icon"><Inbox aria-hidden="true" size={20} /></span><span>Solicitudes creadas</span><strong>126</strong><small>Conversión ficticia: 3,6%</small></article>
        <article><span className="metric-icon"><UserRoundCheck aria-hidden="true" size={20} /></span><span>Perfiles activos</span><strong>48</strong><small>Indicador ficticio</small></article>
        <article><span className="metric-icon"><Star aria-hidden="true" size={20} /></span><span>Calificación media</span><strong>4,7</strong><small>98 evaluaciones demo</small></article>
      </div>
      <div className="dashboard-columns">
        <AdminCard title="Demanda por región" description="Distribución relativa ficticia">
          <div className="admin-bar-list">{regions.map((region) => <div className="admin-bar-row" key={region.label}><div className="admin-bar-label"><span>{region.label}</span><strong>{region.value}</strong></div><div className="admin-bar-track"><span style={{ width: `${region.value}%` }} /></div></div>)}</div>
        </AdminCard>
        <AdminCard title="Servicios más solicitados" description="Volumen relativo ficticio">
          <div className="admin-bar-list">{services.map((service) => <div className="admin-bar-row" key={service.label}><div className="admin-bar-label"><span>{service.label}</span><strong>{service.value}</strong></div><div className="admin-bar-track"><span style={{ width: `${service.value}%` }} /></div></div>)}</div>
        </AdminCard>
      </div>
    </section>
  );
}
