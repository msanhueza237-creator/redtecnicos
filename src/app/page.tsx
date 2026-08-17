import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  House,
  Info,
  MessageCircleMore,
  ShieldCheck,
  ShoppingBasket,
  UserRoundSearch,
} from "lucide-react";
import { HeroSearch } from "@/components/hero-search";
import { ProfessionalCard } from "@/components/professional-card";
import type { ProfessionalCategory } from "@/domain/directory";
import { calculateDirectoryMetrics } from "@/domain/directory-metrics";
import { listPublicReviews } from "@/lib/directory/public-reviews";
import { listDirectoryProfessionals } from "@/lib/directory/repository";
import { getPublicSiteContentMap } from "@/lib/content/repository";
import { isSupabaseMode } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Técnicos de refrigeración y climatización en Chile",
  description: "Busca y compara perfiles de técnicos y empresas de refrigeración industrial, comercial y climatización residencial en Chile.",
};

const categories: Array<{
  id: ProfessionalCategory;
  label: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  icon: typeof Factory;
}> = [
  {
    id: "industrial",
    label: "Industrial",
    title: "Plantas, chillers y cámaras de gran escala",
    description: "Sistemas frigoríficos industriales, salas de máquinas, conservación y procesos de frío.",
    image: "/images/categories/industrial.webp",
    alt: "Planta ficticia de refrigeración industrial",
    icon: Factory,
  },
  {
    id: "commercial",
    label: "Comercial",
    title: "Supermercados, gastronomía y pequeños negocios",
    description: "Vitrinas, cámaras, máquinas de hielo y refrigeración para comercio y alimentación.",
    image: "/images/categories/commercial.webp",
    alt: "Vitrinas refrigeradas en un comercio ficticio",
    icon: ShoppingBasket,
  },
  {
    id: "residential",
    label: "Residencial",
    title: "Climatización para hogares y oficinas",
    description: "Instalación, mantención y diagnóstico de equipos split, multisplit y bombas de calor.",
    image: "/images/categories/residential.webp",
    alt: "Técnico latinoamericano ficticio instalando un equipo split",
    icon: House,
  },
];

const reviewDateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeZone: "America/Santiago",
});

export default async function HomePage() {
  const [professionals, publicReviews, siteContent] = await Promise.all([
    listDirectoryProfessionals(),
    listPublicReviews(3),
    getPublicSiteContentMap(),
  ]);
  const featuredProfessionals = [...professionals]
    .sort((left, right) => right.score - left.score || right.rating - left.rating)
    .slice(0, 6);
  const metrics = calculateDirectoryMetrics(professionals);
  const isLive = isSupabaseMode();
  const directoryNotice = siteContent.home_directory_notice;
  const professionalCta = siteContent.home_professional_cta;
  const reviewGridClass = publicReviews.length === 1
    ? "testimonial-grid is-single"
    : publicReviews.length === 2
      ? "testimonial-grid is-pair"
      : "testimonial-grid";

  return (
    <>
      <section className="landing-hero">
        <div className="container landing-hero-grid">
          <div className="landing-hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" /> Red especializada en Chile</span>
            <h1>El técnico en refrigeración correcto, <span>a un clic de distancia</span></h1>
            <p>Compara técnicos y empresas de refrigeración industrial, comercial y climatización residencial. Revisa su información y solicita contacto directo.</p>
            <div className="hero-trust" aria-label="Características del directorio">
              <span><CheckCircle2 size={17} aria-hidden="true" /> Sin comisiones</span>
              <span><CheckCircle2 size={17} aria-hidden="true" /> Información revisable</span>
              <span><CheckCircle2 size={17} aria-hidden="true" /> Solicitud registrada</span>
            </div>
            <HeroSearch />
          </div>

          <div className="landing-hero-media">
            <Image
              alt="Técnico latinoamericano ficticio revisando un sistema de refrigeración industrial"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 46vw"
              src="/images/reference/hero-red-tecnicos.webp"
            />
            <div className="landing-floating-card is-verified"><ShieldCheck size={20} aria-hidden="true" /><span><strong>Perfiles revisables</strong><small>Señales visibles y fechadas</small></span></div>
            <div className="landing-floating-card is-contact"><MessageCircleMore size={20} aria-hidden="true" /><span><strong>Contacto inmediato</strong><small>Después de registrar tu solicitud</small></span></div>
          </div>
        </div>
        <div className="container landing-metrics" aria-label={isLive ? "Indicadores reales del directorio" : "Indicadores de demostración calculados"}>
          <div><strong>{metrics.profileCount}</strong><span>{isLive ? "Perfiles publicados" : "Perfiles ficticios"}</span></div>
          <div><strong>{metrics.communeCount}</strong><span>Comunas cubiertas</span></div>
          <div><strong>{metrics.publishedReviewCount}</strong><span>{isLive ? "Evaluaciones publicadas" : "Evaluaciones demo"}</span></div>
          <div><strong>{metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : "—"}</strong><span>{isLive ? "Calificación promedio" : "Calificación demo"}</span></div>
        </div>
      </section>

      {directoryNotice.enabled ? (
        <section className="managed-directory-notice" aria-labelledby="managed-directory-notice-title">
          <div className="container managed-directory-notice-inner">
            <span className="managed-directory-notice-icon"><ShieldCheck aria-hidden="true" size={25} /></span>
            <div>
              <span className="eyebrow">{directoryNotice.eyebrow}</span>
              <h2 id="managed-directory-notice-title">{directoryNotice.title}</h2>
              <p>{directoryNotice.body}</p>
            </div>
            <div className="managed-directory-notice-actions">
              <Link className="button button-primary" href={directoryNotice.primaryCtaHref as Route}>{directoryNotice.primaryCtaLabel}</Link>
              {directoryNotice.secondaryCtaLabel && directoryNotice.secondaryCtaHref ? <Link className="button button-secondary" href={directoryNotice.secondaryCtaHref as Route}>{directoryNotice.secondaryCtaLabel}</Link> : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="categories-title">
        <div className="container">
          <div className="section-header landing-section-header">
            <div><span className="eyebrow">Especialidades</span><h2 id="categories-title">Tres áreas, una misma red profesional</h2><p>Encuentra perfiles según el tipo de instalación o equipo que necesitas atender.</p></div>
          </div>
          <div className="category-showcase">
            {categories.map(({ id, label, title, description, image, alt, icon: Icon }) => (
              <Link className="category-card" href={`/tecnicos?category=${id}` as Route} key={id}>
                <div className="category-card-media"><Image alt={alt} fill sizes="(max-width: 800px) 100vw, 33vw" src={image} /></div>
                <div className="category-card-body">
                  <span className={`category-pill is-${id}`}><Icon size={14} aria-hidden="true" /> {label}</span>
                  <h3>{title}</h3><p>{description}</p><span className="category-card-link">Ver técnicos <ArrowRight size={15} aria-hidden="true" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-subtle" aria-labelledby="featured-title">
        <div className="container">
          <div className="section-header">
            <div><span className="eyebrow">Directorio profesional</span><h2 id="featured-title">Encuentra tu técnico de confianza</h2><p>{isLive ? "Perfiles publicados después de una revisión administrativa de su información." : "Perfiles ficticios preparados para revisar la experiencia."}</p></div>
            <Link className="button button-secondary" href="/tecnicos">Ver directorio completo <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          {featuredProfessionals.length > 0 ? <div className="cards-grid landing-profile-grid">
            {featuredProfessionals.map((professional) => <ProfessionalCard professional={professional} key={professional.id} />)}
          </div> : <div className="empty-state"><UserRoundSearch size={30} aria-hidden="true" /><h3>Estamos incorporando los primeros perfiles</h3><p>Los técnicos y empresas aparecerán aquí una vez aprobados por administración.</p><Link className="button button-primary" href="/registro-tecnico">Publicar mi perfil</Link></div>}
        </div>
      </section>

      <section className="section" aria-labelledby="process-title">
        <div className="container">
          <div className="section-header landing-section-header"><div><span className="eyebrow">Cómo funciona</span><h2 id="process-title">Simple para clientes y profesionales</h2><p>Dos recorridos claros, sin convertir a Red Técnicos Chile en parte de la contratación.</p></div></div>
          <div className="audience-process-grid">
            <article className="audience-process-card">
              <span className="audience-label"><UserRoundSearch size={17} aria-hidden="true" /> Para el cliente</span>
              <h3>Necesito un servicio</h3>
              <ol><li><span>1</span><div><strong>Busca y compara</strong><p>Filtra por categoría, región, comuna, experiencia y formación revisada.</p></div></li><li><span>2</span><div><strong>Revisa el perfil</strong><p>Consulta cobertura, servicios, tres trabajos y evaluaciones asociadas a solicitudes.</p></div></li><li><span>3</span><div><strong>Solicita contacto</strong><p>Registra tu necesidad y recibe inmediatamente correo, teléfono y WhatsApp.</p></div></li></ol>
            </article>
            <article className="audience-process-card is-professional">
              <span className="audience-label"><BadgeCheck size={17} aria-hidden="true" /> Para el técnico</span>
              <h3>Quiero ofrecer mis servicios</h3>
              <ol><li><span>1</span><div><strong>Crea tu perfil breve</strong><p>Completa cuenta, presentación, servicios y cobertura en cuatro etapas.</p></div></li><li><span>2</span><div><strong>Mejora tu vitrina</strong><p>Agrega después formación y hasta tres fotografías desde el panel.</p></div></li><li><span>3</span><div><strong>Gestiona solicitudes</strong><p>Revisa cada contacto y registra su avance desde un historial privado.</p></div></li></ol>
              <Link className="button button-primary" href="/registro-tecnico">Publicar mi perfil <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-blue" aria-labelledby="stories-title">
        <div className="container">
          <div className="section-header landing-section-header is-light"><div><span className="eyebrow">{isLive ? "Opiniones verificadas" : "Opiniones de demostración"}</span><h2 id="stories-title">Experiencias de clientes verificados</h2><p>{isLive ? "Solo publicamos evaluaciones asociadas a solicitudes completadas, correos verificados y una revisión administrativa." : "Ejemplos ficticios para revisar cómo se presentarán las evaluaciones verificadas."}</p></div></div>
          {publicReviews.length > 0 ? (
            <div className={reviewGridClass}>
              {publicReviews.map((review) => {
                const profileHref = (review.professionalKind === "company" ? `/empresas/${review.profileSlug}` : `/tecnicos/${review.profileSlug}`) as Route;
                return (
                  <article key={review.id}>
                    <span className="testimonial-stars" aria-label={`${review.rating} de 5 estrellas`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                    <blockquote>“{review.comment}”</blockquote>
                    <div className="testimonial-identity"><BadgeCheck aria-hidden="true" size={18} /><div><strong>{review.isDemo ? "Cliente ficticio" : "Cliente verificado"}</strong><small>{review.commune} · {review.service}</small></div></div>
                    <div className="testimonial-card-footer">
                      <time dateTime={review.publishedAt}>{review.isDemo ? "Ejemplo de demostración" : reviewDateFormatter.format(new Date(review.publishedAt))}</time>
                      <Link href={profileHref}>Ver perfil de {review.professionalName}</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="testimonial-empty"><BadgeCheck aria-hidden="true" size={28} /><h3>Las primeras experiencias verificadas aparecerán aquí</h3><p>No completaremos este espacio con testimonios ficticios. Cada opinión deberá provenir de una solicitud completada y ser aprobada por administración.</p></div>
          )}
          <div className="testimonial-actions"><Link className="button button-secondary" href="/tecnicos?sort=rating">Ver técnicos mejor evaluados <ArrowRight aria-hidden="true" size={16} /></Link></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {professionalCta.enabled ? <div className="professional-cta landing-final-cta">
            <div><span className="eyebrow"><ClipboardCheck size={17} aria-hidden="true" /> {professionalCta.eyebrow}</span><h2>{professionalCta.title}</h2><p>{professionalCta.body}</p></div>
            <div className="cta-actions"><Link className="button button-lime" href={professionalCta.primaryCtaHref as Route}>{professionalCta.primaryCtaLabel}</Link>{professionalCta.secondaryCtaLabel && professionalCta.secondaryCtaHref ? <Link className="button button-secondary" href={professionalCta.secondaryCtaHref as Route}>{professionalCta.secondaryCtaLabel}</Link> : null}</div>
          </div> : null}
          <div className="legal-note landing-legal-note"><Info size={22} aria-hidden="true" /><p><strong>Red Técnicos Chile funciona como directorio informativo y canal de contacto.</strong> La selección, presupuesto, pago, ejecución y garantía se acuerdan directamente entre cliente y profesional.</p></div>
        </div>
      </section>
    </>
  );
}
