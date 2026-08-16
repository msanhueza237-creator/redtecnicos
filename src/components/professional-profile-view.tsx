import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Car,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  FileCheck2,
  GraduationCap,
  Info,
  MapPin,
  Star,
  Wrench,
} from "lucide-react";
import { ContactPreview } from "@/components/contact-preview";
import { categoryLabels } from "@/data/demo-professionals";
import type { Professional, VerificationBadge } from "@/domain/directory";

const qualificationLabels = {
  professional_degree: "Título profesional",
  technical_degree: "Título técnico",
  training: "Capacitación",
} as const;

const badgeIcons: Record<VerificationBadge, typeof CheckCircle2> = {
  "Identidad revisada": BadgeCheck,
  "Correo confirmado": CheckCircle2,
  "Teléfono confirmado": CheckCircle2,
  "Formación revisada": FileCheck2,
  "Perfil completo": CircleGauge,
  "Fotografías aprobadas": CheckCircle2,
};

export function ProfessionalProfileView({ professional }: { professional: Professional }) {
  const typeLabel = professional.kind === "company" ? "Empresa" : "Técnico independiente";

  return (
    <>
      <header className="profile-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link><ChevronRight size={13} aria-hidden="true" />
            <Link href="/tecnicos">Directorio</Link><ChevronRight size={13} aria-hidden="true" />
            <span aria-current="page">{professional.displayName}</span>
          </nav>
          <div className="profile-hero-grid">
            <div className="profile-main-identity">
              <div className="avatar profile-avatar" aria-hidden="true">{professional.initials}</div>
              <div>
                <span className="demo-pill">{professional.isDemo ? `Perfil de demostración — ${professional.kind === "company" ? "empresa" : "técnico"} ficticio` : professional.status === "verified" ? "Perfil verificado" : "Perfil publicado"}</span>
                <h1>{professional.displayName}</h1>
                <p className="profile-headline">{professional.headline}</p>
                <div className="profile-quick-meta">
                  <span><BriefcaseBusiness size={16} aria-hidden="true" /> {typeLabel}</span>
                  <span><MapPin size={16} aria-hidden="true" /> {professional.region}</span>
                  <span><CalendarClock size={16} aria-hidden="true" /> {professional.availability}</span>
                </div>
                <div className="profile-category-row" aria-label="Categorías profesionales">
                  {professional.categories.map((category) => (
                    <span className={`category-pill is-${category}`} key={category}>{categoryLabels[category]}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="profile-metrics" aria-label="Resumen del perfil">
              <div>
                <strong><Star size={18} fill="currentColor" aria-hidden="true" /> {professional.rating.toFixed(1)}</strong>
                <span>{professional.reviewCount} evaluaciones publicadas</span>
              </div>
              <div>
                <strong>{professional.score}/100</strong>
                <span>Nivel de completitud y revisión</span>
              </div>
            </div>
          </div>
          <div className="badge-row profile-badges">
            {professional.badges.map((badge) => {
              const Icon = badgeIcons[badge];
              return <span className="badge" key={badge}><Icon size={14} aria-hidden="true" /> {badge}</span>;
            })}
          </div>
        </div>
      </header>

      <section className="section profile-section">
        <div className="container profile-layout">
          <div className="profile-content">
            <section className="profile-block" aria-labelledby="presentacion-title">
              <h2 id="presentacion-title">Presentación profesional</h2>
              <p>{professional.summary}</p>
              <div className="facts-grid">
                <div><span>Experiencia declarada</span><strong>{professional.yearsExperience} años</strong></div>
                <div><span>Tiempo de respuesta</span><strong>{professional.responseTime}</strong></div>
                <div><span>Modalidades</span><strong>{professional.modalities.join(" · ")}</strong></div>
                <div><span>Vehículo declarado</span><strong>{professional.vehicle ? "Sí" : "No"} <Car size={15} aria-hidden="true" /></strong></div>
              </div>
            </section>

            <section className="profile-block" aria-labelledby="services-title">
              <h2 id="services-title">Servicios ofrecidos</h2>
              <div className="service-list">
                {professional.services.map((service) => (
                  <span key={service}><Wrench size={17} aria-hidden="true" /> {service}</span>
                ))}
              </div>
            </section>

            <section className="profile-block" aria-labelledby="coverage-title">
              <h2 id="coverage-title">Cobertura declarada</h2>
              <p>Región principal: <strong>{professional.region}</strong></p>
              <div className="chip-row">
                {professional.communes.map((commune) => <span className="service-chip" key={commune}><MapPin size={13} aria-hidden="true" /> {commune}</span>)}
              </div>
            </section>

            <section className="profile-block" aria-labelledby="qualifications-title">
              <h2 id="qualifications-title">Formación y capacitaciones revisadas</h2>
              {professional.qualifications.length > 0 ? (
                <div className="certificate-list">
                  {professional.qualifications.map((qualification) => (
                    <article key={qualification.id}>
                      <span className="icon-box"><GraduationCap size={20} aria-hidden="true" /></span>
                      <div>
                        <span className="qualification-type">{qualificationLabels[qualification.type]}</span>
                        <strong>{qualification.title}</strong>
                        <p>{qualification.institution} · {qualification.issuedYear} · {qualification.reviewedAt}. El respaldo completo es privado.</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted-copy">Este perfil todavía no muestra formación revisada.</p>
              )}
            </section>

            <section className="profile-block" aria-labelledby="portfolio-title">
              <div className="profile-block-heading">
                <div>
                  <h2 id="portfolio-title">Trabajos realizados</h2>
                  <p>{professional.isDemo ? "Imágenes ilustrativas de demostración; no corresponden a trabajos atribuibles a una persona real." : "Fotografías declaradas por el profesional y aprobadas para publicación."}</p>
                </div>
                <span className="professional-panel-status is-approved">{professional.portfolio.length}/3 revisadas</span>
              </div>
              <div className="portfolio-grid">
                {professional.portfolio.map((item) => (
                  <article className="portfolio-item" key={item.id}>
                    <Image alt={item.alt} height={512} sizes="(max-width: 700px) 100vw, 33vw" src={item.imageSrc} width={768} />
                    <div><strong>{item.title}</strong><span>{item.category}{professional.isDemo ? " · Demostración" : ""}</span></div>
                  </article>
                ))}
              </div>
            </section>

            <section className="profile-block" aria-labelledby="reviews-title">
              <h2 id="reviews-title">Evaluaciones asociadas a solicitudes completadas</h2>
              <div className="review-preview">
                <div className="review-score"><strong>{professional.rating.toFixed(1)}</strong><span>de 5</span></div>
                <div><div className="rating"><Star size={17} fill="currentColor" aria-hidden="true" /> {professional.isDemo ? "Calificación simulada" : "Calificación verificada"}</div><p>Solo puede evaluar quien tenga una solicitud completada y el correo de contacto verificado.</p></div>
              </div>
            </section>

            <div className="legal-note">
              <Info size={22} aria-hidden="true" />
              <p>La revisión confirma únicamente que determinada información fue presentada y revisada en una fecha específica; no constituye una garantía de calidad, seguridad, disponibilidad o resultado del servicio.</p>
            </div>
          </div>

          <aside className="profile-contact" id="contacto">
            <ContactPreview
              professionalId={professional.id}
              professionalSlug={professional.slug}
              professionalName={professional.displayName}
              professionalKind={professional.kind}
              services={professional.services}
              communes={professional.communes}
              isDemo={professional.isDemo}
            />
          </aside>
        </div>
      </section>
    </>
  );
}
