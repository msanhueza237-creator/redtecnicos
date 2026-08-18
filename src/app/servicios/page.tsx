import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowRight, Building2, ChevronRight, House, Snowflake, Wrench } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { serviceLandingPages } from "@/data/organic-content";
import { publicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Servicios de refrigeración y climatización",
  description:
    "Busca técnicos para instalación y mantención de aire acondicionado, refrigeración comercial y cámaras de frío en Chile.",
  alternates: { canonical: "/servicios" },
  openGraph: {
    title: "Servicios de refrigeración y climatización en Chile",
    description:
      "Compara perfiles por especialidad, cobertura e información publicada antes de solicitar contacto.",
    url: "/servicios",
  },
};

const serviceIcons = {
  residential: House,
  commercial: Building2,
  industrial: Snowflake,
} as const;

export default function ServicesPage() {
  const url = publicSiteUrl("/servicios");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#collection`,
        url,
        name: "Servicios de refrigeración y climatización",
        description: metadata.description,
        isPartOf: { "@id": `${publicSiteUrl("/")}#website` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: serviceLandingPages.map((page, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: page.shortTitle,
            url: publicSiteUrl(`/servicios/${page.slug}`),
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: publicSiteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Servicios", item: url },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <header className="page-hero organic-page-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link><ChevronRight size={13} aria-hidden="true" /><span aria-current="page">Servicios</span>
          </nav>
          <span className="eyebrow">Busca según tu necesidad</span>
          <h1>Servicios de refrigeración y climatización</h1>
          <p>Explora perfiles por tipo de trabajo, compara su cobertura e información publicada y solicita contacto directo.</p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="organic-card-grid">
            {serviceLandingPages.map((page) => {
              const Icon = serviceIcons[page.category];
              return (
                <article className="organic-card" key={page.slug}>
                  <span className="icon-box"><Icon size={22} aria-hidden="true" /></span>
                  <span className="eyebrow">{page.eyebrow}</span>
                  <h2>{page.shortTitle}</h2>
                  <p>{page.description}</p>
                  <Link href={`/servicios/${page.slug}` as Route}>
                    Ver técnicos y orientación <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section-subtle">
        <div className="container organic-two-column">
          <div>
            <span className="eyebrow">Antes de contactar</span>
            <h2>Una solicitud clara recibe mejores respuestas</h2>
            <p>Incluye el tipo de equipo, la comuna, el síntoma, marca o modelo y el nivel de urgencia. Evita enviar información sensible o intervenir componentes eléctricos y refrigerantes.</p>
          </div>
          <div className="organic-action-card">
            <Wrench size={25} aria-hidden="true" />
            <div><strong>¿No sabes qué categoría elegir?</strong><p>Busca directamente por el nombre del equipo o problema en el directorio completo.</p></div>
            <Link className="button button-primary" href="/tecnicos">Buscar técnicos</Link>
          </div>
        </div>
      </section>
    </>
  );
}
