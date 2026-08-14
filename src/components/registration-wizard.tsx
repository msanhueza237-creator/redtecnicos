"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Info, UserRound } from "lucide-react";

const stages = [
  {
    title: "Cuenta y contacto",
    description: "Correo, celular y contraseña para comenzar. La confirmación se realizará por correo.",
  },
  {
    title: "Perfil profesional",
    description: "Nombre público, tipo de perfil, experiencia y una presentación breve.",
  },
  {
    title: "Servicios y cobertura",
    description: "Servicios principales, región, comunas y modalidad de atención.",
  },
  {
    title: "Revisión y envío",
    description: "Documento principal, vista previa y aceptación de los términos de publicación.",
  },
] as const;

export function RegistrationWizard({ kind }: { kind: "technician" | "company" }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [finished, setFinished] = useState(false);
  const stage = stages[currentStage] ?? stages[0];
  const Icon = kind === "company" ? Building2 : UserRound;

  if (finished) {
    return (
      <div className="wizard-complete" role="status">
        <span className="icon-box"><Check size={23} aria-hidden="true" /></span>
        <h2>Recorrido de demostración completado</h2>
        <p>No se creó una cuenta ni se guardó información. La conexión real con Supabase se implementará en el ciclo 3.</p>
        <button className="button button-primary" type="button" onClick={() => { setFinished(false); setCurrentStage(0); }}>Reiniciar recorrido</button>
      </div>
    );
  }

  return (
    <div className="wizard-shell">
      <aside className="wizard-steps" aria-label="Etapas de registro">
        <div className="wizard-kind"><Icon size={19} aria-hidden="true" /><strong>{kind === "company" ? "Empresa" : "Técnico independiente"}</strong></div>
        <ol>
          {stages.map((item, index) => (
            <li key={item.title} className={index === currentStage ? "is-current" : index < currentStage ? "is-complete" : ""}>
              <button type="button" onClick={() => setCurrentStage(index)} aria-current={index === currentStage ? "step" : undefined}>
                <span>{index < currentStage ? <Check size={13} aria-hidden="true" /> : index + 1}</span>{item.title}
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <section className="wizard-content" aria-labelledby="wizard-stage-title">
        <div className="contact-demo-label"><Info size={15} aria-hidden="true" /> Prototipo local: no ingreses datos reales</div>
        <span className="step-number">Etapa {currentStage + 1} de {stages.length}</span>
        <h2 id="wizard-stage-title">{stage.title}</h2>
        <p>{stage.description}</p>
        <p className="contact-submit-help">
          La galería, los títulos y las capacitaciones podrán completarse después desde el panel profesional.
        </p>
        <div className="wizard-preview-fields">
          <div className="field">
            <label htmlFor="wizard-example-one">Campo de ejemplo</label>
            <input className="input" id="wizard-example-one" placeholder="Contenido ficticio para revisar el diseño" autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="wizard-example-two">Información complementaria</label>
            <textarea className="textarea" id="wizard-example-two" placeholder="No se guardará ni enviará esta información." />
          </div>
        </div>
        <div className="wizard-actions">
          <button className="button button-secondary" type="button" disabled={currentStage === 0} onClick={() => setCurrentStage((current) => Math.max(0, current - 1))}>
            <ArrowLeft size={16} aria-hidden="true" /> Anterior
          </button>
          {currentStage < stages.length - 1 ? (
            <button className="button button-primary" type="button" onClick={() => setCurrentStage((current) => current + 1)}>
              Siguiente <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button className="button button-primary" type="button" onClick={() => setFinished(true)}>
              Simular envío a revisión <Check size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
