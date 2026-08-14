import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface ContentSection {
  title: string;
  paragraphs: string[];
  items?: string[];
}

interface ContentPageProps {
  eyebrow: string;
  title: string;
  introduction: string;
  sections: ContentSection[];
  legalDraft?: boolean;
}

export function ContentPage({ eyebrow, title, introduction, sections, legalDraft = false }: ContentPageProps) {
  return (
    <>
      <header className="page-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link><ChevronRight size={13} aria-hidden="true" /><span aria-current="page">{title}</span>
          </nav>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{introduction}</p>
        </div>
      </header>
      <section className="section">
        <div className="container prose-layout">
          {legalDraft ? (
            <div className="draft-warning" role="note">
              <AlertTriangle size={20} aria-hidden="true" />
              <div><strong>Borrador para revisión legal</strong><p>Este contenido no debe publicarse como texto definitivo sin revisión jurídica en Chile.</p></div>
            </div>
          ) : null}
          <div className="prose-card">
            {sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
