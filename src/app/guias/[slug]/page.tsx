import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenCheck, CalendarDays, ChevronRight, Clock3, ExternalLink, Info, Search } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { OrganicShareLinks } from "@/components/organic-share-links";
import { getOrganicGuide, getServiceLandingPage, organicGuides } from "@/data/organic-content";
import { publicSiteUrl } from "@/lib/site-url";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return organicGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getOrganicGuide(slug);
  if (!guide) return { title: "Guía no encontrada", robots: { index: false, follow: false } };

  const pathname = `/guias/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: pathname },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: pathname,
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getOrganicGuide(slug);
  if (!guide) notFound();

  const pathname = `/guias/${guide.slug}`;
  const url = publicSiteUrl(pathname);
  const relatedService = guide.serviceSlug ? getServiceLandingPage(guide.serviceSlug) : undefined;
  const ctaHref = relatedService ? `/servicios/${relatedService.slug}` as Route : "/tecnicos";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: guide.title,
        description: guide.description,
        datePublished: guide.publishedAt,
        dateModified: guide.updatedAt,
        inLanguage: "es-CL",
        mainEntityOfPage: url,
        author: {
          "@type": "Organization",
          name: "Equipo editorial de Red Técnicos Chile",
          url: publicSiteUrl("/"),
        },
        publisher: { "@id": `${publicSiteUrl("/")}#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: publicSiteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Guías", item: publicSiteUrl("/guias") },
          { "@type": "ListItem", position: 3, name: guide.title, item: url },
        ],
      },
    ],
  };
  const dateFormatter = new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeZone: "America/Santiago",
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <article>
        <header className="page-hero organic-page-hero organic-article-hero">
          <div className="container organic-content-width">
            <nav className="breadcrumbs" aria-label="Ruta de navegación">
              <Link href="/">Inicio</Link><ChevronRight size={13} aria-hidden="true" />
              <Link href={"/guias" as Route}>Guías</Link><ChevronRight size={13} aria-hidden="true" />
              <span aria-current="page">{guide.title}</span>
            </nav>
            <span className="eyebrow">{guide.eyebrow}</span>
            <h1>{guide.title}</h1>
            <p>{guide.introduction}</p>
            <div className="organic-article-meta">
              <span><BookOpenCheck size={16} aria-hidden="true" /> Equipo editorial de Red Técnicos Chile</span>
              <span><CalendarDays size={16} aria-hidden="true" /> Actualizada el {dateFormatter.format(new Date(`${guide.updatedAt}T12:00:00-04:00`))}</span>
              <span><Clock3 size={16} aria-hidden="true" /> {guide.readTime}</span>
            </div>
          </div>
        </header>

        <section className="section organic-article-section">
          <div className="container organic-content-width">
            <OrganicShareLinks campaign={`guia_${guide.slug}`} pathname={pathname} title={guide.title} />
            <div className="organic-article-body">
              {guide.sections.map((section) => (
                <section key={section.title}>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.items ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
                </section>
              ))}
            </div>

            {guide.source ? (
              <aside className="organic-source">
                <strong>Fuente técnica complementaria</strong>
                <a href={guide.source.href} rel="noopener noreferrer" target="_blank">{guide.source.label} <ExternalLink size={14} aria-hidden="true" /></a>
              </aside>
            ) : null}

            <div className="legal-note organic-legal-note">
              <Info size={22} aria-hidden="true" />
              <p>Esta guía entrega orientación general y no reemplaza la evaluación en terreno, las instrucciones del fabricante ni los protocolos de seguridad aplicables.</p>
            </div>
          </div>
        </section>
      </article>

      <section className="section section-subtle">
        <div className="container organic-content-width">
          <div className="professional-cta organic-guide-cta">
            <div>
              <span className="eyebrow">Siguiente paso</span>
              <h2>{relatedService ? `Compara perfiles para ${relatedService.shortTitle.toLocaleLowerCase("es-CL")}` : "Busca un perfil según tu necesidad"}</h2>
              <p>Revisa servicios, cobertura e información publicada antes de solicitar contacto.</p>
            </div>
            <div className="cta-actions">
              <Link className="button button-lime" href={ctaHref}><Search size={17} aria-hidden="true" /> Ver perfiles</Link>
              <Link className="button button-secondary" href={"/guias" as Route}>Más guías <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
