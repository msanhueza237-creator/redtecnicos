import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, ChevronRight, ClipboardCheck, Search } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { organicGuides } from "@/data/organic-content";
import { publicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Guías de refrigeración y climatización para clientes",
  description:
    "Guías prácticas para elegir técnicos, preparar una solicitud y reconocer cuándo pedir servicio de refrigeración o climatización.",
  alternates: { canonical: "/guias" },
  openGraph: {
    title: "Guías para contratar servicios de refrigeración y climatización",
    description:
      "Orientación práctica para buscar, comparar y contactar técnicos con mejor información.",
    url: "/guias",
  },
};

export default function GuidesPage() {
  const url = publicSiteUrl("/guias");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#collection`,
        url,
        name: "Guías de refrigeración y climatización para clientes",
        description: metadata.description,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: organicGuides.map((guide, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: guide.title,
            url: publicSiteUrl(`/guias/${guide.slug}`),
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: publicSiteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Guías", item: url },
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
            <Link href="/">Inicio</Link><ChevronRight size={13} aria-hidden="true" /><span aria-current="page">Guías</span>
          </nav>
          <span className="eyebrow">Decide con más contexto</span>
          <h1>Guías para clientes de refrigeración y climatización</h1>
          <p>Orientación práctica para describir tu necesidad, comparar perfiles y conversar un alcance claro antes de contratar.</p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="organic-card-grid">
            {organicGuides.map((guide) => (
              <article className="organic-card" key={guide.slug}>
                <span className="icon-box"><BookOpenCheck size={22} aria-hidden="true" /></span>
                <span className="eyebrow">{guide.eyebrow} · {guide.readTime}</span>
                <h2>{guide.title}</h2>
                <p>{guide.description}</p>
                <Link href={`/guias/${guide.slug}` as Route}>Leer guía <ArrowRight size={16} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-subtle">
        <div className="container organic-two-column">
          <div>
            <span className="eyebrow">De la orientación a la acción</span>
            <h2>Cuando estés listo, busca por servicio y ubicación</h2>
            <p>El directorio permite comparar cobertura, experiencia, información revisada y trabajos publicados antes de registrar una solicitud.</p>
          </div>
          <div className="organic-action-card">
            <ClipboardCheck size={25} aria-hidden="true" />
            <div><strong>Tu solicitud queda registrada</strong><p>Después del contacto podrás usar el seguimiento privado y, si el trabajo se completa, enviar una evaluación.</p></div>
            <Link className="button button-primary" href="/tecnicos"><Search size={17} aria-hidden="true" /> Buscar técnicos</Link>
          </div>
        </div>
      </section>
    </>
  );
}
