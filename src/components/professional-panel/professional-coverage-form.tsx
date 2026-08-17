"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, MapPin, Save, Search } from "lucide-react";
import { updateProfessionalCoverageAction } from "@/app/panel/cobertura/actions";
import { communeOptionsForRegion } from "@/data/chile-communes";
import {
  initialCoverageActionState,
  orderedCoverageCommunes,
} from "@/domain/professional-coverage";
import {
  chileRegionOptions,
  professionalModalities,
} from "@/domain/professional-registration";

interface ProfessionalCoverageFormProps {
  initialRegionCode: string;
  initialCommuneNames: readonly string[];
  initialModalities: readonly string[];
  initialHasVehicle: boolean;
  profileStatus: string;
}

function normalizedSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-CL");
}

export function ProfessionalCoverageForm({
  initialRegionCode,
  initialCommuneNames,
  initialModalities,
  initialHasVehicle,
  profileStatus,
}: Readonly<ProfessionalCoverageFormProps>) {
  const [state, action, pending] = useActionState(
    updateProfessionalCoverageAction,
    initialCoverageActionState,
  );
  const [regionCode, setRegionCode] = useState(initialRegionCode);
  const [primaryCommune, setPrimaryCommune] = useState(initialCommuneNames[0] ?? "");
  const [selectedCommunes, setSelectedCommunes] = useState<string[]>(
    orderedCoverageCommunes(initialCommuneNames[0] ?? "", initialCommuneNames),
  );
  const [query, setQuery] = useState("");
  const communeOptions = communeOptionsForRegion(regionCode);
  const filteredCommunes = useMemo(() => {
    const normalizedQuery = normalizedSearch(query.trim());
    if (!normalizedQuery) return communeOptions;
    return communeOptions.filter((commune) => normalizedSearch(commune.name).includes(normalizedQuery));
  }, [communeOptions, query]);
  const allRegionSelected = communeOptions.length > 0 && selectedCommunes.length === communeOptions.length;
  const needsReview = ["approved", "verified", "under_review"].includes(profileStatus);

  function changeRegion(nextRegionCode: string) {
    setRegionCode(nextRegionCode);
    setPrimaryCommune("");
    setSelectedCommunes([]);
    setQuery("");
  }

  function changePrimaryCommune(nextPrimary: string) {
    setPrimaryCommune(nextPrimary);
    setSelectedCommunes((current) => orderedCoverageCommunes(nextPrimary, current));
  }

  function toggleCommune(communeName: string, checked: boolean) {
    setSelectedCommunes((current) => checked
      ? orderedCoverageCommunes(primaryCommune, [...current, communeName])
      : current.filter((name) => name !== communeName || name === primaryCommune));
  }

  return (
    <form action={action} className="professional-panel-form">
      <div className="professional-panel-form-grid">
        <label className="professional-panel-field">
          <span>Región principal</span>
          <select
            name="regionCode"
            onChange={(event) => changeRegion(event.target.value)}
            required
            value={regionCode}
          >
            <option value="">Selecciona una región</option>
            {chileRegionOptions.map((region) => (
              <option key={region.code} value={region.code}>{region.name}</option>
            ))}
          </select>
        </label>
        <label className="professional-panel-field">
          <span>Comuna principal</span>
          <select
            disabled={!regionCode}
            name="primaryCommune"
            onChange={(event) => changePrimaryCommune(event.target.value)}
            required
            value={primaryCommune}
          >
            <option value="">{regionCode ? "Selecciona una comuna" : "Selecciona primero una región"}</option>
            {communeOptions.map((commune) => (
              <option key={commune.code} value={commune.name}>{commune.name}</option>
            ))}
          </select>
          <small>Se muestra como ubicación principal; no publicamos tu domicilio.</small>
        </label>
      </div>

      <fieldset className="coverage-fieldset" disabled={!regionCode || !primaryCommune || pending}>
        <legend>Comunas donde atiendes</legend>
        <div className="coverage-toolbar">
          <label className="coverage-search">
            <Search aria-hidden="true" size={17} />
            <span className="panel-sr-only">Buscar una comuna</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar comuna"
              type="search"
              value={query}
            />
          </label>
          <div className="coverage-toolbar-actions">
            <button
              className="button button-secondary"
              disabled={allRegionSelected}
              onClick={() => setSelectedCommunes(communeOptions.map((commune) => commune.name))}
              type="button"
            >
              <Check aria-hidden="true" size={16} /> Seleccionar las {communeOptions.length} comunas
            </button>
            <button
              className="coverage-clear-button"
              disabled={selectedCommunes.length <= (primaryCommune ? 1 : 0)}
              onClick={() => setSelectedCommunes(primaryCommune ? [primaryCommune] : [])}
              type="button"
            >
              Dejar solo la principal
            </button>
          </div>
        </div>

        <div className="coverage-selection-summary" aria-live="polite">
          <MapPin aria-hidden="true" size={18} />
          <strong>{selectedCommunes.length} de {communeOptions.length}</strong> comunas seleccionadas
          {allRegionSelected ? <span>· Cobertura regional completa</span> : null}
        </div>

        {primaryCommune ? <input name="communes" type="hidden" value={primaryCommune} /> : null}
        <div className="coverage-commune-grid">
          {filteredCommunes.map((commune) => {
            const isPrimary = commune.name === primaryCommune;
            return (
              <label className={isPrimary ? "is-primary" : ""} key={commune.code}>
                <input
                  checked={selectedCommunes.includes(commune.name)}
                  disabled={isPrimary}
                  name="communes"
                  onChange={(event) => toggleCommune(commune.name, event.target.checked)}
                  type="checkbox"
                  value={commune.name}
                />
                <span>{commune.name}{isPrimary ? <small>Principal</small> : null}</span>
              </label>
            );
          })}
        </div>
        {filteredCommunes.length === 0 ? <p className="coverage-empty">No encontramos una comuna con ese nombre.</p> : null}
      </fieldset>

      <fieldset className="coverage-fieldset">
        <legend>Forma de atención</legend>
        <div className="coverage-modality-grid">
          {professionalModalities.map((modality) => (
            <label key={modality}>
              <input
                defaultChecked={initialModalities.includes(modality)}
                name="modalities"
                type="checkbox"
                value={modality}
              />
              <span>{modality}</span>
            </label>
          ))}
          <label>
            <input defaultChecked={initialHasVehicle} name="hasVehicle" type="checkbox" />
            <span>Dispongo de vehículo</span>
          </label>
        </div>
      </fieldset>

      {needsReview ? (
        <div className="coverage-review-note" role="note">
          Al guardar, la nueva cobertura pasará a revisión. Si ya tienes un perfil publicado,
          su versión aprobada seguirá visible mientras administración revisa el cambio.
        </div>
      ) : null}
      {state.message ? (
        <p className="auth-message" data-status={state.status} role="status">{state.message}</p>
      ) : null}
      <div className="professional-panel-actions">
        <button
          className="button button-primary"
          disabled={pending || !primaryCommune || selectedCommunes.length === 0}
          type="submit"
        >
          <Save aria-hidden="true" size={17} /> {pending ? "Guardando…" : "Guardar cobertura"}
        </button>
      </div>
    </form>
  );
}
