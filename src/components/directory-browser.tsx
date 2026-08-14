"use client";

import { useMemo, useState } from "react";
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { ProfessionalCard } from "@/components/professional-card";
import { categoryLabels, chileRegions, serviceCatalog } from "@/data/demo-professionals";
import {
  defaultDirectoryFilters,
  filterProfessionals,
  type DirectoryFilters,
  type Professional,
  type ProfessionalCategory,
  type ProfessionalKind,
} from "@/domain/directory";

interface DirectoryBrowserProps {
  professionals: readonly Professional[];
  initialFilters?: Partial<DirectoryFilters>;
}

function uniqueCommunes(professionals: readonly Professional[], region: string): string[] {
  return [...new Set(
    professionals
      .filter((professional) => !region || professional.region === region)
      .flatMap((professional) => professional.communes),
  )].sort((left, right) => left.localeCompare(right, "es-CL"));
}

export function DirectoryBrowser({ professionals, initialFilters = {} }: DirectoryBrowserProps) {
  const [filters, setFilters] = useState<DirectoryFilters>({ ...defaultDirectoryFilters, ...initialFilters });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const enableDemoProfiles = process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES !== "false";
  const communes = useMemo(
    () => uniqueCommunes(professionals, filters.region),
    [filters.region, professionals],
  );
  const results = useMemo(
    () => filterProfessionals(professionals, filters, enableDemoProfiles),
    [enableDemoProfiles, filters, professionals],
  );

  function updateFilter<Key extends keyof DirectoryFilters>(key: Key, value: DirectoryFilters[Key]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "region" ? { commune: "" } : {}),
    }));
  }

  function resetFilters() {
    setFilters(defaultDirectoryFilters);
  }

  const activeFilterCount = [
    filters.query,
    filters.region,
    filters.commune,
    filters.service,
    filters.category,
    filters.kind,
    filters.verifiedOnly,
    filters.certifiedOnly,
    filters.vehicleOnly,
    filters.availability,
    filters.modality,
    filters.minimumExperience > 0,
    filters.minimumRating > 0,
  ].filter(Boolean).length;

  const filterFields = (
    <>
      <div className="filters-heading">
        <div>
          <SlidersHorizontal size={19} aria-hidden="true" />
          <strong>Filtrar resultados</strong>
        </div>
        <button className="icon-button mobile-filter-close" type="button" aria-label="Cerrar filtros" onClick={() => setFiltersOpen(false)}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="field">
        <label htmlFor="filter-query">Buscar por nombre o especialidad</label>
        <div className="input-with-icon">
          <Search size={17} aria-hidden="true" />
          <input
            className="input"
            id="filter-query"
            type="search"
            value={filters.query}
            onChange={(event) => updateFilter("query", event.target.value)}
            placeholder="Ej. refrigeración"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="filter-category">Categoría</label>
        <select
          className="select"
          id="filter-category"
          value={filters.category}
          onChange={(event) => updateFilter("category", event.target.value as ProfessionalCategory | "")}
        >
          <option value="">Todas las categorías</option>
          {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-region">Región</label>
        <select className="select" id="filter-region" value={filters.region} onChange={(event) => updateFilter("region", event.target.value)}>
          <option value="">Todas</option>
          {chileRegions.map((region) => <option key={region} value={region}>{region}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-commune">Comuna</label>
        <select className="select" id="filter-commune" value={filters.commune} onChange={(event) => updateFilter("commune", event.target.value)}>
          <option value="">Todas</option>
          {communes.map((commune) => <option key={commune} value={commune}>{commune}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-service">Servicio</label>
        <select className="select" id="filter-service" value={filters.service} onChange={(event) => updateFilter("service", event.target.value)}>
          <option value="">Todos</option>
          {serviceCatalog.map((service) => <option key={service} value={service}>{service}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-kind">Tipo de perfil</label>
        <select
          className="select"
          id="filter-kind"
          value={filters.kind}
          onChange={(event) => updateFilter("kind", event.target.value as ProfessionalKind | "")}
        >
          <option value="">Técnicos y empresas</option>
          <option value="technician">Técnico independiente</option>
          <option value="company">Empresa</option>
        </select>
      </div>

      <div className="field two-columns">
        <div>
          <label htmlFor="filter-experience">Experiencia mínima</label>
          <select className="select" id="filter-experience" value={filters.minimumExperience} onChange={(event) => updateFilter("minimumExperience", Number(event.target.value))}>
            <option value={0}>Cualquiera</option>
            <option value={5}>5 años</option>
            <option value={10}>10 años</option>
            <option value={15}>15 años</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-rating">Calificación mínima</label>
          <select className="select" id="filter-rating" value={filters.minimumRating} onChange={(event) => updateFilter("minimumRating", Number(event.target.value))}>
            <option value={0}>Cualquiera</option>
            <option value={4}>4,0</option>
            <option value={4.5}>4,5</option>
            <option value={4.8}>4,8</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="filter-availability">Disponibilidad</label>
        <select
          className="select"
          id="filter-availability"
          value={filters.availability}
          onChange={(event) => updateFilter("availability", event.target.value as DirectoryFilters["availability"])}
        >
          <option value="">Cualquiera</option>
          <option value="Disponible esta semana">Disponible esta semana</option>
          <option value="Agenda limitada">Agenda limitada</option>
          <option value="Solo emergencias">Solo emergencias</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-modality">Modalidad de atención</label>
        <select
          className="select"
          id="filter-modality"
          value={filters.modality}
          onChange={(event) => updateFilter("modality", event.target.value as DirectoryFilters["modality"])}
        >
          <option value="">Cualquiera</option>
          <option value="Domiciliaria">Domiciliaria</option>
          <option value="Comercial">Comercial</option>
          <option value="Taller">Taller</option>
        </select>
      </div>

      <fieldset className="checkbox-group">
        <legend>Señales y recursos</legend>
        <label className="checkbox-row">
          <input type="checkbox" checked={filters.verifiedOnly} onChange={(event) => updateFilter("verifiedOnly", event.target.checked)} />
          <span>Identidad revisada</span>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={filters.certifiedOnly} onChange={(event) => updateFilter("certifiedOnly", event.target.checked)} />
          <span>Formación revisada</span>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={filters.vehicleOnly} onChange={(event) => updateFilter("vehicleOnly", event.target.checked)} />
          <span>Vehículo propio declarado</span>
        </label>
      </fieldset>

      <button className="button button-ghost reset-button" type="button" onClick={resetFilters}>
        <RotateCcw size={16} aria-hidden="true" /> Limpiar filtros
      </button>
    </>
  );

  return (
    <div className="directory-layout">
      <button
        className="button button-secondary mobile-filter-trigger"
        type="button"
        aria-controls="directory-filters"
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen(true)}
      >
        <Filter size={17} aria-hidden="true" /> Filtros {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
      </button>

      {filtersOpen ? <button className="filter-overlay" type="button" aria-label="Cerrar filtros" onClick={() => setFiltersOpen(false)} /> : null}
      <aside id="directory-filters" className={`filters-panel ${filtersOpen ? "is-open" : ""}`} aria-label="Filtros del directorio">
        {filterFields}
      </aside>

      <section className="directory-results" aria-labelledby="results-title">
        <div className="results-toolbar">
          <div aria-live="polite">
            <h2 id="results-title">{results.length} perfiles de ejemplo</h2>
            <p>Todos los resultados son ficticios y están excluidos de estadísticas reales.</p>
          </div>
          <div className="field sort-field">
            <label htmlFor="sort-results">Ordenar por</label>
            <select className="select" id="sort-results" value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value as DirectoryFilters["sort"])}>
              <option value="relevance">Relevancia</option>
              <option value="score">Nivel de revisión</option>
              <option value="rating">Calificación</option>
              <option value="reviews">Cantidad de evaluaciones</option>
            </select>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="directory-grid">
            {results.map((professional) => <ProfessionalCard professional={professional} key={professional.id} />)}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={28} aria-hidden="true" />
            <h2>No encontramos perfiles de ejemplo con esos filtros</h2>
            <p>Prueba ampliando la región, el servicio o las señales requeridas.</p>
            <button className="button button-primary" type="button" onClick={resetFilters}>Limpiar filtros</button>
          </div>
        )}
      </section>
    </div>
  );
}
