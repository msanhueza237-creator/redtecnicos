import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, Images, MapPin, Star, UserRound, Wrench } from "lucide-react";
import { categoryLabels } from "@/data/demo-professionals";
import type { Professional } from "@/domain/directory";
import { MAX_PUBLIC_GALLERY_PREVIEW_ITEMS } from "@/domain/professional-gallery";
import { ProfessionalAvatar } from "@/components/professional-avatar";

export function ProfessionalCard({ professional }: { professional: Professional }) {
  const profileHref = `/${professional.kind === "company" ? "empresas" : "tecnicos"}/${professional.slug}` as Route;
  const typeLabel = professional.kind === "company" ? "Empresa" : "Técnico independiente";
  const previewImages = professional.portfolio
    .filter((item) => item.status === "approved")
    .slice(0, MAX_PUBLIC_GALLERY_PREVIEW_ITEMS);

  return (
    <article className="profile-card">
      <div className="card-topline" aria-hidden="true" />
      {previewImages.length ? (
        <Link
          aria-label={`Ver perfil y trabajos de ${professional.displayName}`}
          className="profile-card-gallery"
          href={profileHref}
        >
          <span className="profile-card-gallery-grid" data-count={previewImages.length}>
            {previewImages.map((item) => (
              <span className="profile-card-gallery-image" key={item.id}>
                <Image
                  alt={item.alt}
                  fill
                  sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 30vw"
                  src={item.imageSrc}
                />
              </span>
            ))}
          </span>
          <span className="profile-card-gallery-label"><Images aria-hidden="true" size={14} /> {previewImages.length} {previewImages.length === 1 ? "trabajo destacado" : "trabajos destacados"}</span>
        </Link>
      ) : (
        <Link
          aria-label={`Ver perfil de ${professional.displayName}`}
          className="profile-card-gallery is-empty"
          href={profileHref}
        >
          <Images aria-hidden="true" size={25} />
          <span>Galería aún sin trabajos aprobados</span>
        </Link>
      )}
      <div className="profile-card-body">
        <div className="profile-identity">
          <ProfessionalAvatar imageUrl={professional.avatarUrl} initials={professional.initials} name={professional.displayName} sizes="56px" />
          <div>
            <span className="demo-pill">{professional.isDemo ? "Perfil de demostración" : professional.status === "verified" ? "Perfil verificado" : "Perfil publicado"}</span>
            <h3>
              <Link href={profileHref}>{professional.displayName}</Link>
            </h3>
            <p className="profile-kind">
              {professional.kind === "company" ? <Building2 size={13} aria-hidden="true" /> : <UserRound size={13} aria-hidden="true" />} {typeLabel}
            </p>
          </div>
        </div>

        <div className="card-meta">
          <span>
            <MapPin size={15} aria-hidden="true" /> {professional.region} · {professional.communes.slice(0, 2).join(", ")}
          </span>
          <span>
            <BriefcaseBusiness size={15} aria-hidden="true" /> {professional.yearsExperience} años de experiencia declarada
          </span>
          <span>
            <Wrench size={15} aria-hidden="true" /> {professional.availability}
          </span>
        </div>

        <div className="profile-category-row" aria-label="Categorías profesionales">
          {professional.categories.map((category) => (
            <span className={`category-pill is-${category}`} key={category}>{categoryLabels[category]}</span>
          ))}
        </div>

        <div className="chip-row" aria-label="Servicios principales">
          {professional.services.slice(0, 3).map((service) => (
            <span className="service-chip" key={service}>
              {service}
            </span>
          ))}
        </div>

        <div className="card-score-row">
          <span className="rating" aria-label={`Calificación ${professional.rating} de 5, basada en ${professional.reviewCount} evaluaciones`}>
            <Star size={16} fill="currentColor" aria-hidden="true" /> {professional.rating.toFixed(1)} ({professional.reviewCount})
          </span>
          <span className="score">
            <strong>{professional.score}/100</strong>
            <span>Nivel de revisión</span>
          </span>
        </div>

        {professional.qualifications[0] ? (
          <p className="profile-qualification-summary">
            <GraduationCap size={15} aria-hidden="true" /> {professional.qualifications[0].title}
          </p>
        ) : null}

        <div className="card-actions">
          <Link className="button button-secondary" href={profileHref}>
            Ver perfil
          </Link>
          {professional.acceptsNewRequests === false ? (
            <span className="button button-secondary" aria-label="Este profesional no recibe nuevas solicitudes">Agenda pausada</span>
          ) : (
            <Link className="button button-primary" href={`${profileHref}#contacto` as Route}>
              Solicitar contacto <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
