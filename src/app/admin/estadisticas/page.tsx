import type { Metadata, Route } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  Inbox,
  MessageSquareText,
  MessageSquareWarning,
  Star,
  UserRoundCheck,
} from "lucide-react";
import {
  AdminCard,
  AdminDemoNotice,
  AdminOperationalNotice,
  AdminPageHeading,
} from "@/components/admin/admin-ui";
import {
  bucketStatisticsTimeline,
  createDemoAdminStatistics,
  createEmptyAdminStatistics,
  parseStatisticsPeriod,
  statisticsPeriods,
  type StatisticsTimelineBucket,
  type ProfileVisitRanking,
} from "@/domain/admin-statistics";
import { regionNameFromCode } from "@/domain/professional-registration";
import { getAdminStatistics } from "@/lib/admin/statistics";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Estadísticas | Administración" };
export const dynamic = "force-dynamic";

interface StatisticsPageProps {
  searchParams: Promise<{ period?: string | string[] }>;
}

const numberFormatter = new Intl.NumberFormat("es-CL");
const decimalFormatter = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});
const generatedAtFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

const requestStatusLabels: Record<string, string> = {
  new: "Nuevas",
  viewed: "Revisadas",
  contacted: "Contactadas",
  accepted: "Aceptadas",
  rejected: "Rechazadas",
  completed: "Completadas",
  cancelled: "Canceladas",
  expired: "Expiradas",
};

function periodLabel(period: number): string {
  return period === 365 ? "12 meses" : `${period} días`;
}

function formatBucketDate(bucket: StatisticsTimelineBucket): string {
  const start = dateFormatter.format(new Date(`${bucket.startDate}T12:00:00Z`));
  const end = dateFormatter.format(new Date(`${bucket.endDate}T12:00:00Z`));
  return start === end ? start : `${start}–${end}`;
}

function RankingList({
  items,
  getLabel,
  emptyMessage,
}: Readonly<{
  items: { key: string; value: number }[];
  getLabel?: (key: string) => string;
  emptyMessage: string;
}>) {
  if (!items.length) return <p className="admin-statistics-empty">{emptyMessage}</p>;
  const maximum = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="admin-bar-list">
      {items.map((item) => (
        <div className="admin-bar-row" key={item.key}>
          <div className="admin-bar-label">
            <span>{getLabel?.(item.key) ?? item.key}</span>
            <strong>{numberFormatter.format(item.value)}</strong>
          </div>
          <div className="admin-bar-track" aria-hidden="true">
            <span style={{ width: `${item.value * 100 / maximum}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileVisitRankingList({ items }: Readonly<{ items: ProfileVisitRanking[] }>) {
  if (!items.length) {
    return <p className="admin-statistics-empty">Las visitas comenzarán a aparecer cuando se abran perfiles públicos.</p>;
  }
  const maximum = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="admin-bar-list admin-profile-visit-list">
      {items.map((item, index) => {
        const href = `/${item.kind === "company" ? "empresas" : "tecnicos"}/${item.slug}` as Route;
        return (
          <div className="admin-bar-row" key={item.profileId}>
            <div className="admin-bar-label admin-profile-visit-label">
              <span className="admin-profile-visit-name">
                <small>{index + 1}</small>
                <span><Link href={href}>{item.name}</Link><small>{item.kind === "company" ? "Empresa" : "Técnico independiente"}</small></span>
              </span>
              <strong>{numberFormatter.format(item.value)} {item.value === 1 ? "visita" : "visitas"}</strong>
            </div>
            <div className="admin-bar-track" aria-hidden="true">
              <span style={{ width: `${item.value * 100 / maximum}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function StatisticsPage({ searchParams }: StatisticsPageProps) {
  const periodDays = parseStatisticsPeriod((await searchParams).period);
  const isLive = isSupabaseAuthMode();
  const result = isLive
    ? await getAdminStatistics(periodDays)
    : { data: createDemoAdminStatistics(periodDays), error: null };
  const statistics = result.data ?? createEmptyAdminStatistics(periodDays);
  const timeline = bucketStatisticsTimeline(statistics.requestTimeline);
  const maximumTimelineValue = Math.max(...timeline.map((bucket) => bucket.value), 1);
  const hasTimelineActivity = timeline.some((bucket) => bucket.value > 0);

  return (
    <section className="admin-page admin-statistics-page">
      <AdminPageHeading
        eyebrow={isLive ? "Operación real" : "Módulo de demostración"}
        title="Estadísticas"
        description="Comprende la demanda, el avance de las solicitudes y el estado operativo de la red sin exponer datos personales."
      />

      {isLive ? (
        <AdminOperationalNotice>
          Indicadores agregados desde Supabase. Se excluyen perfiles y registros demo; esta vista no contiene nombres, correos, celulares ni descripciones de clientes.
        </AdminOperationalNotice>
      ) : (
        <AdminDemoNotice>
          Los indicadores de esta vista son ficticios y cambian con el período seleccionado. La versión productiva utiliza únicamente agregados anónimos de Supabase.
        </AdminDemoNotice>
      )}

      {result.error ? <p className="auth-message" role="alert">{result.error}</p> : null}

      <div className="admin-statistics-toolbar">
        <div>
          <strong>Período analizado</strong>
          <span>Las métricas de flujo consideran días calendario de Chile.</span>
        </div>
        <nav aria-label="Período estadístico" className="admin-statistics-periods">
          {statisticsPeriods.map((period) => (
            <Link
              aria-current={period === periodDays ? "page" : undefined}
              className="admin-statistics-period"
              href={`/admin/estadisticas?period=${period}` as Route}
              key={period}
            >
              {periodLabel(period)}
            </Link>
          ))}
        </nav>
      </div>

      <div className="metric-grid admin-metrics admin-statistics-metrics" aria-label="Indicadores operacionales">
        <article><span className="metric-icon"><Inbox aria-hidden="true" size={20} /></span><span>Solicitudes recibidas</span><strong>{numberFormatter.format(statistics.metrics.requestsCreated)}</strong><small>Durante {periodLabel(periodDays)}</small></article>
        <article><span className="metric-icon"><CheckCircle2 aria-hidden="true" size={20} /></span><span>Trabajos completados</span><strong>{numberFormatter.format(statistics.metrics.completedRequests)}</strong><small>{decimalFormatter.format(statistics.metrics.completionRate)}% de cierre en el período</small></article>
        <article><span className="metric-icon"><UserRoundCheck aria-hidden="true" size={20} /></span><span>Perfiles publicados</span><strong>{numberFormatter.format(statistics.metrics.publishedProfiles)}</strong><small>Estado actual, sin perfiles demo</small></article>
        <article><span className="metric-icon"><Star aria-hidden="true" size={20} /></span><span>Calificación media</span><strong>{statistics.metrics.publishedReviews ? decimalFormatter.format(statistics.metrics.averageRating) : "—"}</strong><small>{numberFormatter.format(statistics.metrics.publishedReviews)} evaluaciones publicadas</small></article>
        <article><span className="metric-icon"><MessageSquareText aria-hidden="true" size={20} /></span><span>Evaluaciones pendientes</span><strong>{numberFormatter.format(statistics.metrics.pendingReviews)}</strong><small>Esperando moderación</small></article>
        <article><span className="metric-icon"><MessageSquareWarning aria-hidden="true" size={20} /></span><span>Reclamos abiertos</span><strong>{numberFormatter.format(statistics.metrics.openComplaints)}</strong><small>Pendientes de cierre</small></article>
      </div>

      <AdminCard
        title="Evolución de solicitudes"
        description={`${numberFormatter.format(statistics.metrics.requestsCreated)} solicitudes recibidas durante ${periodLabel(periodDays)}`}
      >
        {timeline.length ? (
          <div className="admin-statistics-trend-scroll">
            <ol className="admin-statistics-trend" aria-label="Solicitudes agrupadas cronológicamente">
              {timeline.map((bucket) => (
                <li key={`${bucket.startDate}-${bucket.endDate}`}>
                  <strong>{numberFormatter.format(bucket.value)}</strong>
                  <span className="admin-statistics-column" aria-hidden="true">
                    <span style={{ height: `${bucket.value * 100 / maximumTimelineValue}%` }} />
                  </span>
                  <small>{formatBucketDate(bucket)}</small>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {!hasTimelineActivity ? <p className="admin-statistics-empty">Todavía no existen solicitudes en este período.</p> : null}
      </AdminCard>

      <AdminCard
        title="Perfiles más visitados"
        description={`${numberFormatter.format(statistics.metrics.profileViews)} aperturas de fichas públicas durante ${periodLabel(periodDays)}`}
      >
        <ProfileVisitRankingList items={statistics.topProfiles} />
      </AdminCard>

      <div className="dashboard-columns admin-statistics-rankings">
        <AdminCard title="Demanda por región" description="Solicitudes recibidas según la ubicación del profesional">
          <RankingList
            emptyMessage="No hay demanda regional registrada en este período."
            getLabel={regionNameFromCode}
            items={statistics.regions}
          />
        </AdminCard>
        <AdminCard title="Servicios más solicitados" description="Necesidades indicadas por los clientes al contactar">
          <RankingList
            emptyMessage="No hay servicios solicitados en este período."
            items={statistics.services}
          />
        </AdminCard>
      </div>

      <div className="dashboard-columns admin-statistics-bottom-grid">
        <AdminCard title="Estado de las solicitudes" description="Distribución del flujo dentro del período seleccionado">
          <RankingList
            emptyMessage="No hay solicitudes para distribuir por estado."
            getLabel={(key) => requestStatusLabels[key] ?? key}
            items={statistics.requestStatuses}
          />
        </AdminCard>
        <AdminCard title="Alcance de la medición" description="Qué incluye esta primera versión">
          <ul className="admin-statistics-scope-list">
            <li><CheckCircle2 aria-hidden="true" size={17} /><span><strong>Incluido</strong> visitas a perfiles, solicitudes, estados, evaluaciones y reclamos.</span></li>
            <li><CheckCircle2 aria-hidden="true" size={17} /><span><strong>Privacidad</strong> las visitas se guardan como totales diarios; no se conservan IP, cookies, correos ni datos personales.</span></li>
            <li><Eye aria-hidden="true" size={17} /><span><strong>Lectura</strong> una recarga puede sumar otra apertura, por lo que el ranking representa interés relativo y no personas únicas.</span></li>
          </ul>
          <p className="admin-statistics-updated">Actualizado {generatedAtFormatter.format(new Date(statistics.generatedAt))}</p>
        </AdminCard>
      </div>
    </section>
  );
}
