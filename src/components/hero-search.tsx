import { Search } from "lucide-react";
import { categoryLabels, chileRegions } from "@/data/demo-professionals";

export function HeroSearch() {
  return (
    <aside className="hero-card landing-search-card" aria-label="Buscar técnicos">
      <div className="landing-search-heading">
        <h2>¿Qué servicio necesitas?</h2>
        <p>Busca en todo Chile.</p>
      </div>
      <form className="search-form landing-search-form" action="/tecnicos" method="get">
        <div className="field">
          <label htmlFor="hero-query">¿Qué necesitas?</label>
          <input className="input" id="hero-query" name="query" type="search" placeholder="Ej. cámara de frío, split o chiller" />
        </div>
        <div className="field">
          <label htmlFor="hero-category">Categoría</label>
          <select className="select" id="hero-category" name="category" defaultValue="">
            <option value="">Todas las categorías</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="hero-region">Región</label>
          <select className="select" id="hero-region" name="region" defaultValue="">
            <option value="">Todas las regiones</option>
            {chileRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
        <button className="button button-primary" type="submit">
          <Search size={18} aria-hidden="true" /> Buscar técnicos
        </button>
      </form>
    </aside>
  );
}
