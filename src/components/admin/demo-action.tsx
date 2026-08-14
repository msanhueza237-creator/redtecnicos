"use client";

import { useState } from "react";

export function DemoAction({ label, variant = "secondary", confirmation }: { label: string; variant?: "primary" | "secondary"; confirmation?: string }) {
  const [message, setMessage] = useState("");

  return (
    <div>
      <button
        className={`button button-${variant}`}
        onClick={() => setMessage(confirmation ?? `Simulación completada: “${label}”. No se guardó ningún cambio.`)}
        type="button"
      >
        {label}
      </button>
      {message ? <p className="admin-action-feedback" role="status">{message}</p> : null}
    </div>
  );
}

export function ModerationDecision({
  actions,
  resource,
}: Readonly<{ actions: readonly string[]; resource: string }>) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="admin-decision">
      <label>
        <span>Motivo de la decisión</span>
        <textarea
          onChange={(event) => { setReason(event.target.value); setMessage(""); }}
          placeholder="Ej.: la imagen no permite verificar el trabajo declarado."
          rows={3}
          value={reason}
        />
        <small>Obligatorio en producción y registrado en auditoría.</small>
      </label>
      <div className="admin-actions">
        {actions.map((action, index) => (
          <button
            className={`button button-${index === 0 ? "primary" : "secondary"}`}
            key={action}
            onClick={() => {
              if (reason.trim().length < 8) {
                setMessage("Escribe un motivo de al menos 8 caracteres para simular esta decisión.");
                return;
              }
              setMessage(`${action} aplicado a ${resource} solo en la demo. Motivo visible: ${reason.trim()}`);
            }}
            type="button"
          >
            {action}
          </button>
        ))}
      </div>
      {message ? <p className="admin-action-feedback" role="status">{message}</p> : null}
    </div>
  );
}
