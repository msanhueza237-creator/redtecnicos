"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Info,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { registerProfessionalAction } from "@/app/ingresar/actions";
import { communeOptionsForRegion } from "@/data/chile-communes";
import {
  chileRegionOptions,
  professionalModalities,
  professionalServices,
  regionNameFromCode,
} from "@/domain/professional-registration";
import { initialAuthActionState } from "@/lib/auth/action-state";

const stages = [
  { title: "Cuenta y contacto", description: "Crea tu acceso y confirma dónde podremos contactarte." },
  { title: "Perfil profesional", description: "Cuéntales a los clientes quién eres y qué experiencia tienes." },
  { title: "Servicios y cobertura", description: "Indica qué trabajos realizas y en qué zona atiendes." },
  { title: "Revisión y envío", description: "Comprueba la información y envíala a revisión administrativa." },
] as const;

type RegistrationKind = "technician" | "company";

interface RegistrationDraft {
  fullName: string;
  email: string;
  phone: string;
  displayName: string;
  category: "" | "industrial" | "commercial" | "residential";
  yearsExperience: string;
  summary: string;
  services: string[];
  regionCode: string;
  commune: string;
  modalities: string[];
  hasVehicle: boolean;
}

const initialDraft: RegistrationDraft = {
  fullName: "",
  email: "",
  phone: "",
  displayName: "",
  category: "",
  yearsExperience: "0",
  summary: "",
  services: [],
  regionCode: "",
  commune: "",
  modalities: [professionalModalities[0]],
  hasVehicle: false,
};

function FieldErrors({ errors }: Readonly<{ errors?: string[] }>) {
  return errors?.map((error) => <small className="field-error" key={error}>{error}</small>) ?? null;
}

function toggleValue(values: string[], value: string, checked: boolean): string[] {
  return checked ? [...new Set([...values, value])] : values.filter((item) => item !== value);
}

export function RegistrationWizard({
  kind,
  isLive,
}: Readonly<{ kind: RegistrationKind; isLive: boolean }>) {
  const [currentStage, setCurrentStage] = useState(0);
  const [furthestStage, setFurthestStage] = useState(0);
  const [draft, setDraft] = useState<RegistrationDraft>(initialDraft);
  const [clientMessage, setClientMessage] = useState("");
  const [demoFinished, setDemoFinished] = useState(false);
  const [state, action, pending] = useActionState(registerProfessionalAction, initialAuthActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const storageReady = useRef(false);
  const storageKey = `red-tecnicos-registration-${kind}`;
  const stage = stages[currentStage] ?? stages[0];
  const Icon = kind === "company" ? Building2 : UserRound;
  const communeOptions = communeOptionsForRegion(draft.regionCode);

  useEffect(() => {
    const loadDraft = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<RegistrationDraft>;
          // Las contraseñas nunca forman parte del borrador local.
          setDraft((current) => ({ ...current, ...parsed }));
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      } finally {
        storageReady.current = true;
      }
    }, 0);
    return () => window.clearTimeout(loadDraft);
  }, [storageKey]);

  useEffect(() => {
    if (!storageReady.current) return;
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, storageKey]);

  function validateStage(stageIndex: number): boolean {
    setClientMessage("");
    if (stageIndex === 2 && draft.services.length === 0) {
      setClientMessage("Selecciona al menos un servicio para continuar.");
      return false;
    }
    if (stageIndex === 2 && draft.modalities.length === 0) {
      setClientMessage("Selecciona al menos una modalidad de atención.");
      return false;
    }

    const panel = formRef.current?.querySelector<HTMLElement>(`[data-stage="${stageIndex}"]`);
    const controls = panel?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea");
    for (const control of controls ?? []) {
      if (!control.checkValidity()) {
        control.reportValidity();
        return false;
      }
    }
    return true;
  }

  function goNext() {
    if (!validateStage(currentStage)) return;
    const next = Math.min(stages.length - 1, currentStage + 1);
    setCurrentStage(next);
    setFurthestStage((current) => Math.max(current, next));
    window.scrollTo({ top: 180, behavior: "smooth" });
  }

  function selectStage(index: number) {
    if (index > furthestStage) return;
    setClientMessage("");
    setCurrentStage(index);
  }

  if (demoFinished) {
    return (
      <div className="wizard-complete" role="status">
        <span className="icon-box"><Check size={23} aria-hidden="true" /></span>
        <h2>Así llegará la postulación al administrador</h2>
        <p>En el entorno real se creará la cuenta, se enviará el correo de confirmación y el perfil quedará con estado “En revisión”. En esta vista local no se guardó información.</p>
        <button className="button button-primary" type="button" onClick={() => { setDemoFinished(false); setCurrentStage(0); }}>Volver al formulario</button>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="wizard-shell"
      onSubmit={(event) => {
        if (![0, 1, 2, 3].every(validateStage)) {
          event.preventDefault();
          return;
        }
        if (!isLive) {
          event.preventDefault();
          setDemoFinished(true);
        }
      }}
      ref={formRef}
    >
      <input name="kind" type="hidden" value={kind} />
      <aside className="wizard-steps" aria-label="Etapas de registro">
        <div className="wizard-kind"><Icon size={19} aria-hidden="true" /><strong>{kind === "company" ? "Empresa" : "Técnico independiente"}</strong></div>
        <ol>
          {stages.map((item, index) => (
            <li key={item.title} className={index === currentStage ? "is-current" : index < currentStage ? "is-complete" : ""}>
              <button disabled={index > furthestStage} type="button" onClick={() => selectStage(index)} aria-current={index === currentStage ? "step" : undefined}>
                <span>{index < currentStage ? <Check size={13} aria-hidden="true" /> : index + 1}</span>{item.title}
              </button>
            </li>
          ))}
        </ol>
        <div className="wizard-privacy-note"><LockKeyhole aria-hidden="true" size={16} /><span>Tu contraseña no se guarda en el borrador del navegador.</span></div>
      </aside>

      <section className="wizard-content" aria-labelledby="wizard-stage-title">
        <div className="contact-demo-label">
          {isLive ? <ShieldCheck size={15} aria-hidden="true" /> : <Info size={15} aria-hidden="true" />}
          {isLive ? "Registro seguro conectado a Supabase" : "Vista local: no se enviarán datos"}
        </div>
        <span className="step-number">Etapa {currentStage + 1} de {stages.length}</span>
        <h2 id="wizard-stage-title">{stage.title}</h2>
        <p>{stage.description}</p>
        <p className="contact-submit-help">La galería, títulos, capacitaciones y documentos se completarán después desde el panel profesional.</p>

        {state.message ? <p className="auth-message" data-status={state.status} role="status">{state.message}</p> : null}
        {clientMessage ? <p className="auth-message" role="alert">{clientMessage}</p> : null}

        <div className="wizard-stage-panel" data-stage="0" hidden={currentStage !== 0}>
          <div className="field">
            <label htmlFor={`${kind}-full-name`}>{kind === "company" ? "Nombre del responsable" : "Nombre completo"}</label>
            <input autoComplete="name" className="input" id={`${kind}-full-name`} name="fullName" onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} required value={draft.fullName} />
            <FieldErrors errors={state.fieldErrors?.fullName} />
          </div>
          <div className="wizard-field-grid">
            <div className="field">
              <label htmlFor={`${kind}-email`}>Correo electrónico</label>
              <input autoComplete="email" className="input" id={`${kind}-email`} name="email" onChange={(event) => setDraft({ ...draft, email: event.target.value })} required type="email" value={draft.email} />
              <FieldErrors errors={state.fieldErrors?.email} />
            </div>
            <div className="field">
              <label htmlFor={`${kind}-phone`}>Celular</label>
              <input autoComplete="tel" className="input" id={`${kind}-phone`} name="phone" onChange={(event) => setDraft({ ...draft, phone: event.target.value })} pattern="\+?56\s?9\s?\d{4}\s?\d{4}" placeholder="+56 9 1234 5678" required type="tel" value={draft.phone} />
              <FieldErrors errors={state.fieldErrors?.phone} />
            </div>
          </div>
          <div className="wizard-field-grid">
            <div className="field">
              <label htmlFor={`${kind}-password`}>Contraseña</label>
              <input autoComplete="new-password" className="input" id={`${kind}-password`} minLength={12} name="password" required type="password" />
            </div>
            <div className="field">
              <label htmlFor={`${kind}-confirm-password`}>Repetir contraseña</label>
              <input autoComplete="new-password" className="input" id={`${kind}-confirm-password`} minLength={12} name="confirmPassword" required type="password" />
            </div>
          </div>
          <FieldErrors errors={state.fieldErrors?.password} />
          <small className="wizard-help">Usa al menos 12 caracteres, una mayúscula, una minúscula y un número.</small>
        </div>

        <div className="wizard-stage-panel" data-stage="1" hidden={currentStage !== 1}>
          <div className="field">
            <label htmlFor={`${kind}-display-name`}>{kind === "company" ? "Nombre o razón social visible" : "Nombre que verá el cliente"}</label>
            <input className="input" id={`${kind}-display-name`} maxLength={100} name="displayName" onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} required value={draft.displayName} />
            <FieldErrors errors={state.fieldErrors?.displayName} />
          </div>
          <div className="wizard-field-grid">
            <div className="field">
              <label htmlFor={`${kind}-category`}>Categoría principal</label>
              <select className="select" id={`${kind}-category`} name="category" onChange={(event) => setDraft({ ...draft, category: event.target.value as RegistrationDraft["category"] })} required value={draft.category}>
                <option value="">Selecciona una categoría</option>
                <option value="industrial">Refrigeración industrial</option>
                <option value="commercial">Refrigeración comercial</option>
                <option value="residential">Climatización residencial</option>
              </select>
              <FieldErrors errors={state.fieldErrors?.category} />
            </div>
            <div className="field">
              <label htmlFor={`${kind}-experience`}>Años de experiencia</label>
              <input className="input" id={`${kind}-experience`} max={70} min={0} name="yearsExperience" onChange={(event) => setDraft({ ...draft, yearsExperience: event.target.value })} required type="number" value={draft.yearsExperience} />
              <FieldErrors errors={state.fieldErrors?.yearsExperience} />
            </div>
          </div>
          <div className="field">
            <label htmlFor={`${kind}-summary`}>Presentación profesional</label>
            <textarea className="textarea" id={`${kind}-summary`} maxLength={600} minLength={40} name="summary" onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="Describe tu experiencia, tipo de clientes y forma de trabajar." required rows={5} value={draft.summary} />
            <span className="wizard-character-count">{draft.summary.length}/600 caracteres</span>
            <FieldErrors errors={state.fieldErrors?.summary} />
          </div>
        </div>

        <div className="wizard-stage-panel" data-stage="2" hidden={currentStage !== 2}>
          <fieldset className="wizard-choice-fieldset">
            <legend>Servicios principales <small>Selecciona hasta 6</small></legend>
            <div className="wizard-choice-grid">
              {professionalServices.map((service) => (
                <label key={service}>
                  <input checked={draft.services.includes(service)} disabled={!draft.services.includes(service) && draft.services.length >= 6} name="services" onChange={(event) => setDraft({ ...draft, services: toggleValue(draft.services, service, event.target.checked) })} type="checkbox" value={service} />
                  <span>{service}</span>
                </label>
              ))}
            </div>
            <FieldErrors errors={state.fieldErrors?.services} />
          </fieldset>
          <div className="wizard-field-grid">
            <div className="field">
              <label htmlFor={`${kind}-region`}>Región principal</label>
              <select className="select" id={`${kind}-region`} name="regionCode" onChange={(event) => setDraft({ ...draft, regionCode: event.target.value, commune: "" })} required value={draft.regionCode}>
                <option value="">Selecciona una región</option>
                {chileRegionOptions.map((region) => <option key={region.code} value={region.code}>{region.name}</option>)}
              </select>
              <FieldErrors errors={state.fieldErrors?.regionCode} />
            </div>
            <div className="field">
              <label htmlFor={`${kind}-commune`}>Comuna principal</label>
              <select className="select" disabled={!draft.regionCode} id={`${kind}-commune`} name="commune" onChange={(event) => setDraft({ ...draft, commune: event.target.value })} required value={draft.commune}>
                <option value="">{draft.regionCode ? "Selecciona una comuna" : "Selecciona primero una región"}</option>
                {communeOptions.map((commune) => <option key={commune.code} value={commune.name}>{commune.name}</option>)}
              </select>
              <FieldErrors errors={state.fieldErrors?.commune} />
            </div>
          </div>
          <fieldset className="wizard-choice-fieldset">
            <legend>Modalidad de atención</legend>
            <div className="wizard-choice-grid is-compact">
              {professionalModalities.map((modality) => (
                <label key={modality}>
                  <input checked={draft.modalities.includes(modality)} name="modalities" onChange={(event) => setDraft({ ...draft, modalities: toggleValue(draft.modalities, modality, event.target.checked) })} type="checkbox" value={modality} />
                  <span>{modality}</span>
                </label>
              ))}
              <label>
                <input checked={draft.hasVehicle} name="hasVehicle" onChange={(event) => setDraft({ ...draft, hasVehicle: event.target.checked })} type="checkbox" />
                <span>Dispongo de vehículo</span>
              </label>
            </div>
            <FieldErrors errors={state.fieldErrors?.modalities} />
          </fieldset>
        </div>

        <div className="wizard-stage-panel" data-stage="3" hidden={currentStage !== 3}>
          <div className="wizard-review-grid">
            <article><span>Cuenta</span><strong>{draft.fullName || "Sin completar"}</strong><small>{draft.email}<br />{draft.phone}</small></article>
            <article><span>Perfil público</span><strong>{draft.displayName || "Sin completar"}</strong><small>{draft.yearsExperience} años de experiencia</small></article>
            <article><span>Cobertura</span><strong>{draft.commune || "Sin comuna"}</strong><small>{regionNameFromCode(draft.regionCode)}</small></article>
            <article><span>Servicios</span><strong>{draft.services.length} seleccionados</strong><small>{draft.services.slice(0, 2).join(" · ")}</small></article>
          </div>
          <div className="wizard-review-notice"><ShieldCheck aria-hidden="true" size={20} /><div><strong>La publicación no es automática</strong><p>Crearemos tu cuenta y la administración revisará esta información. El teléfono y correo solo se revelarán después de que un cliente registre una solicitud.</p></div></div>
          <label className="auth-consent">
            <input name="terms" required type="checkbox" />
            <span>Acepto los <Link href="/terminos-tecnicos">términos para profesionales</Link> y el tratamiento de datos descrito en <Link href="/privacidad">Privacidad</Link>.</span>
          </label>
          <FieldErrors errors={state.fieldErrors?.terms} />
        </div>

        <div className="wizard-actions">
          <button className="button button-secondary" type="button" disabled={currentStage === 0 || pending} onClick={() => setCurrentStage((current) => Math.max(0, current - 1))}>
            <ArrowLeft size={16} aria-hidden="true" /> Anterior
          </button>
          {currentStage < stages.length - 1 ? (
            <button className="button button-primary" type="button" onClick={goNext}>Siguiente <ArrowRight size={16} aria-hidden="true" /></button>
          ) : (
            <button className="button button-primary" disabled={pending} type="submit">
              {pending ? "Enviando…" : isLive ? "Crear cuenta y enviar a revisión" : "Ver ejemplo de envío"} <Check size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>
    </form>
  );
}
