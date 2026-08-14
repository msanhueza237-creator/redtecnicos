import type { Metadata } from "next";
import { DirectoryBrowser } from "@/components/directory-browser";
import { demoProfessionals } from "@/data/demo-professionals";
import type { DirectoryFilters } from "@/domain/directory";

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
          <span className="eyebrow">Directorio de demostración</span>
          <h1>Técnicos y empresas de refrigeración y climatización</h1>
          <p>Compara cobertura, servicios e información revisada. Los diez perfiles de este ciclo son ejemplos ficticios.</p>
        </div>
      </header>
      <section className="section directory-section">
        <div className="container">
          <div className="legal-note directory-demo-note">
            <strong>Datos ficticios:</strong> este directorio no contiene técnicos reales. Las solicitudes se simulan localmente y no se envía información externa.
          </div>
          <DirectoryBrowser professionals={demoProfessionals} initialFilters={initialFilters} />
        </div>
      </section>
    </>
  );
}
