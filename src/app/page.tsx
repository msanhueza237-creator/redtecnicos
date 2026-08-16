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
import { listDirectoryProfessionals } from "@/lib/directory/repository";
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

const testimonials = [
  { quote: "Pude comparar cobertura y experiencia antes de solicitar el contacto. El proceso fue claro y rápido.", author: "Cliente residencial ficticio", place: "Puerto Montt" },
  { quote: "La ficha permite explicar mejor mis servicios y mostrar trabajos sin depender solo del boca a boca.", author: "Técnico independiente ficticio", place: "Concepción" },
  { quote: "Encontramos una empresa con experiencia declarada en cámaras de frío y dejamos registrada la solicitud.", author: "Comercio gastronómico ficticio", place: "Valparaíso" },
] as const;

export default async function HomePage() {
  const professionals = await listDirectoryProfessionals();
  const featuredProfessionals = [...professionals]
    .sort((left, right) => right.score - left.score || right.rating - left.rating)
    .slice(0, 6);
  const communeCount = new Set(professionals.flatMap((professional) => professional.communes)).size;
  const ratedProfiles = professionals.filter((professional) => professional.reviewCount > 0);
  const averageRating = ratedProfiles.length > 0
    ? ratedProfiles.reduce((total, professional) => total + professional.rating, 0) / ratedProfiles.length
    : 0;
  const isLive = isSupabaseMode();

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
        <div className="container landing-metrics" aria-label="Indicadores de demostración calculados">
          <div><strong>{professionals.length}</strong><span>{isLive ? "Perfiles publicados" : "Perfiles ficticios"}</span></div>
          <div><strong>{communeCount}</strong><span>Comunas cubiertas</span></div>
          <div><strong>3</strong><span>Categorías técnicas</span></div>
          <div><strong>{averageRating > 0 ? averageRating.toFixed(1) : "—"}</strong><span>{isLive ? "Calificación promedio" : "Calificación demo"}</span></div>
        </div>
      </section>

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
          <div className="section-header landing-section-header is-light"><div><span className="eyebrow">Opiniones de demostración</span><h2 id="stories-title">Experiencias que ayudan a decidir</h2><p>En producción, solo se publicarán evaluaciones asociadas a solicitudes completadas y correos verificados.</p></div></div>
          <div className="testimonial-grid">
            {testimonials.map((testimonial) => <article key={testimonial.author}><span aria-label="Cinco estrellas">★★★★★</span><blockquote>“{testimonial.quote}”</blockquote><strong>{testimonial.author}</strong><small>{testimonial.place} · Dato ficticio</small></article>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="professional-cta landing-final-cta">
            <div><span className="eyebrow"><ClipboardCheck size={17} aria-hidden="true" /> Para técnicos y empresas</span><h2>Haz visible tu experiencia en refrigeración y climatización</h2><p>Publica servicios, cobertura, formación revisada y trabajos realizados. Tú mantienes el control de tu información.</p></div>
            <div className="cta-actions"><Link className="button button-lime" href="/registro-tecnico">Registrarme como técnico</Link><Link className="button button-secondary" href="/registro-empresa">Registrar una empresa</Link></div>
          </div>
          <div className="legal-note landing-legal-note"><Info size={22} aria-hidden="true" /><p><strong>Red Técnicos Chile funciona como directorio informativo y canal de contacto.</strong> La selección, presupuesto, pago, ejecución y garantía se acuerdan directamente entre cliente y profesional.</p></div>
        </div>
      </section>
    </>
  );
}
