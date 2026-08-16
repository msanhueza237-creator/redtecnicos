import type { Metadata } from "next";
import { DirectoryBrowser } from "@/components/directory-browser";
import type { DirectoryFilters } from "@/domain/directory";
import { listDirectoryProfessionals } from "@/lib/directory/repository";
import { isSupabaseMode } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Técnicos de refrigeración y climatización",
};

interface DirectoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const params = await searchParams;
  const professionals = await listDirectoryProfessionals();
  const isLive = isSupabaseMode();
  const initialFilters: Partial<DirectoryFilters> = {
    region: firstValue(params.region),
    service: firstValue(params.service),
    query: firstValue(params.query),
    category: firstValue(params.category) as DirectoryFilters["category"],
  };

  return (
    <>
      <header className="page-hero">
        <div className="container">
          <span className="eyebrow">{isLive ? "Directorio profesional" : "Directorio de demostración"}</span>
          <h1>Técnicos y empresas de refrigeración y climatización</h1>
          <p>Compara cobertura, servicios, experiencia e información revisada antes de solicitar contacto.</p>
        </div>
      </header>
      <section className="section directory-section">
        <div className="container">
          {isLive ? null : <div className="legal-note directory-demo-note">
            <strong>Datos ficticios:</strong> este directorio local no contiene técnicos reales.
          </div>}
          <DirectoryBrowser professionals={professionals} initialFilters={initialFilters} />
        </div>
      </section>
    </>
  );
}
