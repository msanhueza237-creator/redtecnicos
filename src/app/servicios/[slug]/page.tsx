import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, ClipboardList, Info, Search, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { ProfessionalCard } from "@/components/professional-card";
import { getOrganicGuide, getServiceLandingPage, serviceLandingPages } from "@/data/organic-content";
import { filterProfessionals } from "@/domain/directory";
import { listDirectoryProfessionals } from "@/lib/directory/repository";
import { professionalProfilePath } from "@/lib/seo";
import { publicSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return serviceLandingPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getServiceLandingPage(slug);
  if (!page) return { title: "Servicio no encontrado", robots: { index: false, follow: false } };

  const pathname = `/servicios/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: pathname },
    openGraph: {
      title: page.title,
      description: page.description,
      url: pathname,
    },
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const page = getServiceLandingPage(slug);
  if (!page) notFound();

  const professionals = filterProfessionals(await listDirectoryProfessionals(), { service: page.service });
  const pathname = `/servicios/${page.slug}`;
  const url = publicSiteUrl(pathname);
  const relatedGuides = page.relatedGuideSlugs.flatMap((guideSlug) => {
    const guide = getOrganicGuide(guideSlug);
    return guide ? [guide] : [];
  });
  const directoryHref = `/tecnicos?service=${encodeURIComponent(page.service)}` as Route;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#collection`,
        url,
        name: page.title,
        description: page.description,
        dateModified: page.updatedAt,
        isPartOf: { "@id": `${publicSiteUrl("/")}#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: professionals.length,
          itemListElement: professionals.map((professional, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: professional.displayName,
            url: publicSiteUrl(professionalProfilePath(professional)),
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: publicSiteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Servicios", item: publicSiteUrl("/servicios") },
          { "@type": "ListItem", position: 3, name: page.shortTitle, item: url },
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
            <Link href="/">Inicio</Link><ChevronRight size={13} aria-hidden="true" />
            <Link href={"/servicios" as Route}>Servicios</Link><ChevronRight size={13} aria-hidden="true" />
            <span aria-current="page">{page.shortTitle}</span>
          </nav>
          <span className="eyebrow">{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p>{page.introduction}</p>
          <div className="organic-hero-actions">
            <Link className="button button-primary" href={directoryHref}><Search size={17} aria-hidden="true" /> Ver perfiles disponibles</Link>
            <a className="button button-secondary" href="#como-elegir">Qué comparar</a>
          </div>
        </div>
      </header>

      <section className="section" aria-labelledby="profiles-title">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">Directorio profesional</span>
              <h2 id="profiles-title">Perfiles que ofrecen {page.service.toLocaleLowerCase("es-CL")}</h2>
              <p>La cobertura y disponibilidad final deben confirmarse directamente con cada profesional.</p>
            </div>
            <Link className="button button-secondary" href={directoryHref}>Aplicar más filtros <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          {professionals.length > 0 ? (
            <div className="cards-grid">
              {professionals.slice(0, 6).map((professional) => <ProfessionalCard key={professional.id} professional={professional} />)}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={30} aria-hidden="true" />
              <h3>Aún no hay perfiles publicados para este servicio</h3>
              <p>Estamos incorporando profesionales. Puedes revisar el directorio general o volver cuando existan nuevas coberturas.</p>
              <Link className="button button-primary" href="/tecnicos">Ver directorio completo</Link>
            </div>
          )}
        </div>
      </section>

      <section className="section section-subtle" id="como-elegir" aria-labelledby="compare-title">
        <div className="container organic-two-column is-top-aligned">
          <article className="organic-checklist-card">
            <span className="icon-box"><ShieldCheck size={22} aria-hidden="true" /></span>
            <h2 id="compare-title">Qué puedes comparar</h2>
            <ul>{page.comparisonPoints.map((item) => <li key={item}><CheckCircle2 size={17} aria-hidden="true" /> <span>{item}</span></li>)}</ul>
          </article>
          <article className="organic-checklist-card">
            <span className="icon-box"><ClipboardList size={22} aria-hidden="true" /></span>
            <h2>Qué incluir en tu solicitud</h2>
            <ul>{page.requestChecklist.map((item) => <li key={item}><CheckCircle2 size={17} aria-hidden="true" /> <span>{item}</span></li>)}</ul>
          </article>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-title">
        <div className="container organic-content-width">
          <div className="section-header"><div><span className="eyebrow">Antes de solicitar contacto</span><h2 id="faq-title">Preguntas frecuentes</h2></div></div>
          <div className="organic-faq-list">
            {page.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
          </div>
          <div className="legal-note organic-legal-note"><Info size={22} aria-hidden="true" /><p><strong>Red Técnicos Chile es un directorio informativo.</strong> No fija precios, no recibe pagos, no ejecuta ni garantiza los servicios publicados.</p></div>
        </div>
      </section>

      {relatedGuides.length > 0 ? (
        <section className="section section-subtle" aria-labelledby="related-guides-title">
          <div className="container">
            <div className="section-header"><div><span className="eyebrow">Prepárate antes de contactar</span><h2 id="related-guides-title">Guías relacionadas</h2></div><Link href={"/guias" as Route}>Ver todas las guías</Link></div>
            <div className="organic-card-grid is-compact">
              {relatedGuides.map((guide) => (
                <article className="organic-card" key={guide.slug}>
                  <span className="icon-box"><BookOpen size={21} aria-hidden="true" /></span>
                  <span className="eyebrow">{guide.readTime}</span>
                  <h3>{guide.title}</h3><p>{guide.description}</p>
                  <Link href={`/guias/${guide.slug}` as Route}>Leer guía <ArrowRight size={16} aria-hidden="true" /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
