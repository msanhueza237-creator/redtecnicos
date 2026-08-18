"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  FileCheck2,
  GraduationCap,
  ImagePlus,
  Mail,
  MapPin,
  Phone,
  Save,
} from "lucide-react";
import type { ContactRequestStatus } from "@/domain/directory";
import { MAX_GALLERY_ITEMS } from "@/domain/professional-gallery";
import type {
  DemoEditableProfessionalProfile,
  DemoPanelCoverage,
  DemoPanelDocument,
  DemoPanelGalleryItem,
  DemoPanelQualification,
  DemoPanelPreferences,
  DemoPanelService,
  DemoProfessionalRequest,
} from "@/data/demo-professional-panel";

const requestStatusLabels: Record<ContactRequestStatus, string> = {
  new: "Nueva",
  viewed: "Vista",
  contacted: "Contactada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  completed: "Completada",
  cancelled: "Cancelada",
  expired: "Vencida",
};

const requestStatusClasses: Record<ContactRequestStatus, string> = {
  new: "is-new",
  viewed: "is-neutral",
  contacted: "is-pending",
  accepted: "is-approved",
  rejected: "is-danger",
  completed: "is-approved",
  cancelled: "is-neutral",
  expired: "is-warning",
};

const notificationOptions = [
  { key: "newRequestEmail", label: "Nueva solicitud" },
  { key: "reviewEmail", label: "Nueva evaluación" },
  { key: "documentExpiryEmail", label: "Documento próximo a vencer" },
] as const;

function DemoSavedMessage({ message }: Readonly<{ message: string | null }>) {
  if (!message) return null;
  return (
    <div className="professional-panel-demo-notice" role="status">
      <Check aria-hidden="true" size={19} />
      <p>{message}</p>
    </div>
  );
}

export function ProfileDemoForm({ profile }: Readonly<{ profile: DemoEditableProfessionalProfile }>) {
  const [form, setForm] = useState({
    displayName: profile.displayName,
    headline: profile.headline,
    summary: profile.summary,
    yearsExperience: String(profile.yearsExperience),
    availability: profile.availability,
    responseTime: profile.responseTime,
    vehicle: profile.vehicle,
  });
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function updateField<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setSavedMessage(null);
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="professional-panel-form"
      onSubmit={(event) => {
        event.preventDefault();
        setSavedMessage("Cambios aplicados solo en esta demostración. Al recargar volverán los datos originales.");
      }}
    >
      <div className="professional-panel-form-grid">
        <label className="professional-panel-field">
          <span>Nombre visible</span>
          <input
            value={form.displayName}
            maxLength={80}
            onChange={(event) => updateField("displayName", event.target.value)}
          />
          <small className="professional-panel-help">Es el nombre que verá el cliente en el directorio.</small>
        </label>
        <label className="professional-panel-field">
          <span>Años de experiencia</span>
          <input
            type="number"
            min={0}
            max={60}
            value={form.yearsExperience}
            onChange={(event) => updateField("yearsExperience", event.target.value)}
          />
        </label>
        <label className="professional-panel-field professional-panel-field-span">
          <span>Título profesional</span>
          <input
            value={form.headline}
            maxLength={120}
            onChange={(event) => updateField("headline", event.target.value)}
          />
        </label>
        <label className="professional-panel-field professional-panel-field-span">
          <span>Descripción pública</span>
          <textarea
            rows={5}
            maxLength={600}
            value={form.summary}
            onChange={(event) => updateField("summary", event.target.value)}
          />
          <small className="professional-panel-help">{form.summary.length}/600 caracteres</small>
        </label>
        <label className="professional-panel-field">
          <span>Disponibilidad</span>
          <select
            value={form.availability}
            onChange={(event) => updateField("availability", event.target.value as typeof form.availability)}
          >
            <option>Disponible esta semana</option>
            <option>Agenda limitada</option>
            <option>Solo emergencias</option>
          </select>
        </label>
        <label className="professional-panel-field">
          <span>Tiempo habitual de respuesta</span>
          <input
            value={form.responseTime}
            maxLength={100}
            onChange={(event) => updateField("responseTime", event.target.value)}
          />
        </label>
        <label className="professional-panel-check professional-panel-field-span">
          <input
            type="checkbox"
            checked={form.vehicle}
            onChange={(event) => updateField("vehicle", event.target.checked)}
          />
          <span>Cuento con vehículo para desplazarme</span>
        </label>
      </div>
      <div className="professional-panel-actions">
        <button className="button button-primary" type="submit">
          <Save aria-hidden="true" size={17} /> Guardar cambios demo
        </button>
      </div>
      <DemoSavedMessage message={savedMessage} />
    </form>
  );
}

export function ServicesDemoManager({ services }: Readonly<{ services: readonly DemoPanelService[] }>) {
  const [statuses, setStatuses] = useState<Record<string, DemoPanelService["status"]>>(
    Object.fromEntries(services.map((service) => [service.id, service.status])),
  );
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="professional-panel-list">
      {services.map((service) => {
        const status = statuses[service.id] ?? service.status;
        const statusLabel = status === "active" ? "Activo" : status === "paused" ? "Pausado" : "En revisión";
        const statusClass = status === "active" ? "is-approved" : status === "paused" ? "is-neutral" : "is-pending";
        return (
          <article key={service.id}>
            <div>
              <div className="professional-panel-list-meta">{service.id} · Perfil ficticio</div>
              <h2>{service.name}</h2>
              <p>{service.description}</p>
              <span className="professional-panel-list-meta">
                {service.modalities.join(" · ")} · {service.indicativePrice}
              </span>
            </div>
            <div className="professional-panel-actions">
              <span className={`professional-panel-status ${statusClass}`}>{statusLabel}</span>
              {status !== "pending_review" && (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    const next = status === "active" ? "paused" : "active";
                    setStatuses((current) => ({ ...current, [service.id]: next }));
                    setMessage(`${service.name} quedó ${next === "active" ? "activo" : "pausado"} solo en esta vista demo.`);
                  }}
                >
                  {status === "active" ? "Pausar" : "Activar"}
                </button>
              )}
            </div>
          </article>
        );
      })}
      <DemoSavedMessage message={message} />
    </div>
  );
}

const coverageOptions = ["Punta Arenas", "Natales", "Porvenir", "Cabo de Hornos"] as const;

export function CoverageDemoForm({ coverage }: Readonly<{ coverage: DemoPanelCoverage }>) {
  const [communes, setCommunes] = useState<string[]>([...coverage.communes]);
  const [acceptsNearby, setAcceptsNearby] = useState(coverage.acceptsNearbyCommunes);
  const [note, setNote] = useState(coverage.travelNote);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="professional-panel-form"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(`Cobertura demo actualizada: ${communes.length} comunas seleccionadas.`);
      }}
    >
      <div className="professional-panel-form-grid">
        <div className="professional-panel-field professional-panel-field-span">
          <span>Región principal</span>
          <input value={coverage.region} readOnly aria-readonly="true" />
          <small className="professional-panel-help">La región requiere revisión administrativa para cambiarse.</small>
        </div>
        <fieldset className="professional-panel-field professional-panel-field-span">
          <legend>Comunas atendidas</legend>
          <div className="professional-panel-grid">
            {coverageOptions.map((commune) => (
              <label className="professional-panel-check" key={commune}>
                <input
                  type="checkbox"
                  checked={communes.includes(commune)}
                  onChange={(event) => {
                    setMessage(null);
                    setCommunes((current) => event.target.checked
                      ? [...current, commune]
                      : current.filter((item) => item !== commune));
                  }}
                />
                <span>{commune}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="professional-panel-check professional-panel-field-span">
          <input
            type="checkbox"
            checked={acceptsNearby}
            onChange={(event) => { setAcceptsNearby(event.target.checked); setMessage(null); }}
          />
          <span>Evaluar solicitudes de comunas cercanas</span>
        </label>
        <label className="professional-panel-field professional-panel-field-span">
          <span>Nota de desplazamiento</span>
          <textarea value={note} rows={3} onChange={(event) => { setNote(event.target.value); setMessage(null); }} />
        </label>
      </div>
      <div className="professional-panel-actions">
        <button className="button button-primary" type="submit">Guardar cobertura demo</button>
      </div>
      <DemoSavedMessage message={message} />
    </form>
  );
}

export function DocumentsDemoManager({ documents }: Readonly<{ documents: readonly DemoPanelDocument[] }>) {
  const [renewed, setRenewed] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div>
      <div className="professional-panel-toolbar">
        <p>Los archivos de este ejemplo no existen y no se permite cargar documentos reales.</p>
      </div>
      <div className="professional-panel-table-wrap">
        <table className="professional-panel-table">
          <thead><tr><th>Documento</th><th>Estado</th><th>Vencimiento</th><th>Acción demo</th></tr></thead>
          <tbody>
            {documents.map((document) => {
              const simulated = renewed.has(document.id);
              const label = simulated
                ? "En revisión"
                : document.status === "approved" ? "Aprobado"
                  : document.status === "expiring" ? "Por vencer"
                    : document.status === "changes_requested" ? "Cambios solicitados" : "En revisión";
              const statusClass = simulated || document.status === "pending_review" ? "is-pending"
                : document.status === "approved" ? "is-approved"
                  : document.status === "changes_requested" ? "is-danger" : "is-warning";
              return (
                <tr key={document.id}>
                  <td data-label="Documento"><strong>{document.name}</strong><small>{document.fileName}<br />{document.reviewNote}</small></td>
                  <td data-label="Estado"><span className={`professional-panel-status ${statusClass}`}>{label}</span></td>
                  <td data-label="Vencimiento">{document.expiresAt ?? "No aplica"}</td>
                  <td data-label="Acción demo">
                    {document.status === "expiring" && !simulated ? (
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => {
                          setRenewed((current) => new Set(current).add(document.id));
                          setMessage("Renovación ficticia enviada a revisión. No se cargó ningún archivo.");
                        }}
                      >
                        <FileCheck2 aria-hidden="true" size={16} /> Simular renovación
                      </button>
                    ) : <span className="professional-panel-list-meta">Sin acción</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <DemoSavedMessage message={message} />
    </div>
  );
}

export function GalleryDemoManager({ gallery }: Readonly<{ gallery: readonly DemoPanelGalleryItem[] }>) {
  const [items, setItems] = useState<DemoPanelGalleryItem[]>(gallery.map((item) => ({ ...item })));
  const [message, setMessage] = useState<string | null>(null);

  function moveItem(id: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= current.length) return current;
      const reordered = [...current];
      const [moved] = reordered.splice(index, 1);
      if (!moved) return current;
      reordered.splice(destination, 0, moved);
      return reordered.map((item, itemIndex) => ({ ...item, position: itemIndex + 1 }));
    });
    setMessage("Orden actualizado solo en esta demostración.");
  }

  function updateItem(id: string, field: "title" | "caption" | "category", value: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
    setMessage(null);
  }

  return (
    <>
      <div className="professional-panel-actions">
        <button
          className="button button-primary"
          type="button"
          onClick={() => {
            if (items.length >= MAX_GALLERY_ITEMS) {
              setMessage("El perfil admite un máximo de cinco trabajos. Retira uno antes de agregar otro.");
              return;
            }
            setItems((current) => [...current, {
              id: "GALLERY-DEMO-NEW",
              isDemo: true,
              title: "Nueva instalación de ejemplo",
              caption: "Fotografía ilustrativa agregada localmente para recorrer el flujo.",
              category: "Refrigeración comercial",
              imageSrc: "/images/gallery/comercial-condensadora.webp",
              alt: "Unidad condensadora comercial usada como demostración",
              position: current.length + 1,
              status: "pending_review",
              uploadedAt: new Date().toISOString(),
            }]);
            setMessage("Imagen de ejemplo añadida a la vista y marcada En revisión. No se cargó ningún archivo.");
          }}
        >
          <ImagePlus aria-hidden="true" size={18} /> Agregar trabajo ({items.length}/{MAX_GALLERY_ITEMS})
        </button>
      </div>
      <DemoSavedMessage message={message} />
      <div className="professional-panel-gallery">
        {items.map((item, index) => (
          <article className="professional-panel-gallery-item" key={item.id}>
            <div className="professional-panel-gallery-image">
              <Image alt={item.alt} fill sizes="(max-width: 760px) 100vw, 30vw" src={item.imageSrc} />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div>
              <span className={`professional-panel-status ${item.status === "approved" ? "is-approved" : "is-pending"}`}>
                {item.status === "approved" ? "Aprobada" : "En revisión"}
              </span>
              <label className="professional-panel-field">
                <span>Título</span>
                <input value={item.title} onChange={(event) => updateItem(item.id, "title", event.target.value)} />
              </label>
              <label className="professional-panel-field">
                <span>Categoría</span>
                <input value={item.category} onChange={(event) => updateItem(item.id, "category", event.target.value)} />
              </label>
              <label className="professional-panel-field">
                <span>Descripción</span>
                <textarea rows={3} value={item.caption} onChange={(event) => updateItem(item.id, "caption", event.target.value)} />
              </label>
              <small>Imagen ilustrativa de demostración · Estado de moderación visible</small>
              <div className="professional-panel-actions">
                <button aria-label={`Subir ${item.title}`} className="button button-secondary" disabled={index === 0} onClick={() => moveItem(item.id, -1)} type="button"><ArrowUp aria-hidden="true" size={16} /> Subir</button>
                <button aria-label={`Bajar ${item.title}`} className="button button-secondary" disabled={index === items.length - 1} onClick={() => moveItem(item.id, 1)} type="button"><ArrowDown aria-hidden="true" size={16} /> Bajar</button>
                <button className="button button-ghost" onClick={() => {
                  setItems((current) => current.filter((currentItem) => currentItem.id !== item.id).map((currentItem, currentIndex) => ({ ...currentItem, position: currentIndex + 1 })));
                  setMessage("Trabajo retirado solo de esta vista demo.");
                }} type="button">Retirar</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

const qualificationTypeLabels: Record<DemoPanelQualification["type"], string> = {
  professional_degree: "Título profesional",
  technical_degree: "Título técnico",
  training: "Capacitación",
};

const qualificationStatusLabels: Record<DemoPanelQualification["status"], string> = {
  declared: "Declarada",
  pending_review: "En revisión",
  reviewed: "Revisada",
  changes_requested: "Observada",
  rejected: "Rechazada",
};

export function QualificationsDemoManager({ qualifications }: Readonly<{ qualifications: readonly DemoPanelQualification[] }>) {
  const [items, setItems] = useState<DemoPanelQualification[]>(qualifications.map((item) => ({ ...item })));
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    type: "training" as DemoPanelQualification["type"],
    title: "",
    institution: "",
    issuedYear: String(new Date().getFullYear()),
  });

  return (
    <div className="professional-panel-grid is-wide professional-panel-qualifications">
      <section className="professional-panel-card">
        <div className="professional-panel-card-header">
          <div><h2>Formación declarada</h2><p>Solo los antecedentes revisados aparecen en el perfil público.</p></div>
        </div>
        <div className="professional-panel-list">
          {items.map((item) => (
            <article key={item.id}>
              <GraduationCap aria-hidden="true" size={22} />
              <div>
                <span className="professional-panel-list-meta">{qualificationTypeLabels[item.type]}</span>
                <h3>{item.title}</h3>
                <p>{item.institution} · {item.issuedYear}</p>
                <small>{item.reviewNote}</small>
              </div>
              <span className={`professional-panel-status ${item.status === "reviewed" ? "is-approved" : item.status === "rejected" ? "is-danger" : "is-pending"}`}>{qualificationStatusLabels[item.status]}</span>
            </article>
          ))}
        </div>
      </section>
      <section className="professional-panel-card">
        <div className="professional-panel-card-header"><div><h2>Agregar formación</h2><p>Simulación local sin carga de archivos.</p></div></div>
        <form className="professional-panel-form" onSubmit={(event) => {
          event.preventDefault();
          if (!draft.title.trim() || !draft.institution.trim()) {
            setMessage("Completa el nombre y la institución para continuar.");
            return;
          }
          setItems((current) => [...current, {
            id: `QUAL-DEMO-NEW-${current.length + 1}`,
            isDemo: true,
            type: draft.type,
            title: draft.title.trim(),
            institution: draft.institution.trim(),
            issuedYear: Number(draft.issuedYear),
            status: "pending_review",
            reviewedAt: "Pendiente de revisión",
            documentName: "respaldo-ficticio-demo.pdf",
            reviewNote: "Formación ficticia enviada a revisión local.",
          }]);
          setDraft((current) => ({ ...current, title: "", institution: "" }));
          setMessage("Formación ficticia agregada y marcada En revisión.");
        }}>
          <label className="professional-panel-field"><span>Tipo</span><select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as DemoPanelQualification["type"] }))}>{Object.entries(qualificationTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="professional-panel-field"><span>Nombre</span><input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label>
          <label className="professional-panel-field"><span>Institución</span><input value={draft.institution} onChange={(event) => setDraft((current) => ({ ...current, institution: event.target.value }))} /></label>
          <label className="professional-panel-field"><span>Año de obtención</span><input max={new Date().getFullYear()} min={1950} type="number" value={draft.issuedYear} onChange={(event) => setDraft((current) => ({ ...current, issuedYear: event.target.value }))} /></label>
          <button className="button button-primary" type="submit"><GraduationCap aria-hidden="true" size={17} /> Agregar en demo</button>
          <DemoSavedMessage message={message} />
        </form>
      </section>
    </div>
  );
}

function nextRequestStatus(status: ContactRequestStatus): ContactRequestStatus | null {
  if (status === "new") return "viewed";
  if (status === "viewed") return "contacted";
  if (status === "accepted") return "completed";
  return null;
}

function nextRequestAction(status: ContactRequestStatus): string | null {
  if (status === "new") return "Marcar como vista";
  if (status === "viewed") return "Registrar contacto demo";
  if (status === "accepted") return "Marcar como completada";
  return null;
}

export function RequestsDemoManager({ requests }: Readonly<{ requests: readonly DemoProfessionalRequest[] }>) {
  const [selectedId, setSelectedId] = useState(requests[0]?.id ?? "");
  const [statuses, setStatuses] = useState<Record<string, ContactRequestStatus>>(
    Object.fromEntries(requests.map((request) => [request.id, request.status])),
  );
  const [message, setMessage] = useState<string | null>(null);
  const selected = useMemo(
    () => requests.find((request) => request.id === selectedId) ?? requests[0],
    [requests, selectedId],
  );

  if (!selected) return <div className="professional-panel-empty">No hay solicitudes ficticias.</div>;
  const currentStatus = statuses[selected.id] ?? selected.status;
  const nextStatus = nextRequestStatus(currentStatus);
  const nextAction = nextRequestAction(currentStatus);

  return (
    <div className="professional-panel-request-grid">
      <div className="professional-panel-list" aria-label="Solicitudes ficticias">
        {requests.map((request) => {
          const status = statuses[request.id] ?? request.status;
          return (
            <button
              aria-pressed={request.id === selected.id}
              className="professional-panel-list-item"
              key={request.id}
              type="button"
              onClick={() => { setSelectedId(request.id); setMessage(null); }}
            >
              <span className={`professional-panel-status ${requestStatusClasses[status]}`}>{requestStatusLabels[status]}</span>
              <span className="professional-panel-request-summary">
                <strong>{request.service}</strong>
                <span className="professional-panel-list-meta">{request.id} · {request.customer.commune}</span>
              </span>
            </button>
          );
        })}
      </div>

      <article className="professional-panel-request-detail" aria-live="polite">
        <div className="professional-panel-card-header">
          <div><span className="professional-panel-list-meta">{selected.id}</span><h2>{selected.service}</h2></div>
          <span className={`professional-panel-status ${requestStatusClasses[currentStatus]}`}>{requestStatusLabels[currentStatus]}</span>
        </div>
        <p>{selected.description}</p>
        <div className="professional-panel-card professional-panel-card-body">
          <h3>Cliente ficticio</h3>
          <p><strong>{selected.customer.displayName}</strong></p>
          <p><MapPin aria-hidden="true" size={16} /> {selected.customer.commune}</p>
          <p><Mail aria-hidden="true" size={16} /> {selected.customer.email}</p>
          <p><Phone aria-hidden="true" size={16} /> {selected.customer.phone}</p>
          <small>Estos canales son inválidos y existen únicamente para demostrar el historial.</small>
        </div>
        {nextStatus && nextAction && (
          <div className="professional-panel-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                setStatuses((current) => ({ ...current, [selected.id]: nextStatus }));
                setMessage(`${selected.id} ahora figura como ${requestStatusLabels[nextStatus]} en esta demostración.`);
              }}
            >
              {nextAction}
            </button>
          </div>
        )}
        <DemoSavedMessage message={message} />
      </article>
    </div>
  );
}

export function SettingsDemoForm({ preferences }: Readonly<{ preferences: DemoPanelPreferences }>) {
  const [settings, setSettings] = useState({
    newRequestEmail: preferences.notifications.newRequestEmail,
    reviewEmail: preferences.notifications.reviewEmail,
    documentExpiryEmail: preferences.notifications.documentExpiryEmail,
    digest: preferences.notifications.digest,
    acceptingRequests: preferences.availability.acceptingRequests,
    emergencyRequests: preferences.availability.emergencyRequests,
    scheduleNote: preferences.availability.scheduleNote,
  });
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="professional-panel-form"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("Preferencias actualizadas solo en esta sesión visual de demostración.");
      }}
    >
      <div className="professional-panel-form-grid">
        <fieldset className="professional-panel-field professional-panel-field-span">
          <legend>Notificaciones por correo</legend>
          {notificationOptions.map(({ key, label }) => (
            <label className="professional-panel-check" key={key}>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.checked }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <label className="professional-panel-field">
          <span>Resumen de actividad</span>
          <select
            value={settings.digest}
            onChange={(event) => setSettings((current) => ({ ...current, digest: event.target.value as typeof settings.digest }))}
          >
            <option value="off">Desactivado</option>
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
          </select>
        </label>
        <label className="professional-panel-check">
          <input
            type="checkbox"
            checked={settings.acceptingRequests}
            onChange={(event) => setSettings((current) => ({ ...current, acceptingRequests: event.target.checked }))}
          />
          <span>Aceptar nuevas solicitudes</span>
        </label>
        <label className="professional-panel-check professional-panel-field-span">
          <input
            type="checkbox"
            checked={settings.emergencyRequests}
            onChange={(event) => setSettings((current) => ({ ...current, emergencyRequests: event.target.checked }))}
          />
          <span>Mostrar disponibilidad para emergencias</span>
        </label>
        <label className="professional-panel-field professional-panel-field-span">
          <span>Nota de agenda</span>
          <textarea
            rows={3}
            value={settings.scheduleNote}
            onChange={(event) => setSettings((current) => ({ ...current, scheduleNote: event.target.value }))}
          />
        </label>
      </div>
      <div className="professional-panel-actions">
        <button className="button button-primary" type="submit">Guardar preferencias demo</button>
      </div>
      <DemoSavedMessage message={message} />
    </form>
  );
}
