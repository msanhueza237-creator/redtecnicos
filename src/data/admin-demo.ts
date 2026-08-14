export type AdminStatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export type AdminApplication = {
  id: string;
  name: string;
  kind: "Técnico" | "Empresa";
  region: string;
  commune: string;
  specialty: string;
  status: "Enviada" | "En revisión" | "Cambios solicitados" | "Aprobada" | "Rechazada";
  updated: string;
  score: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  summary: string;
};

export const adminApplications: AdminApplication[] = [
  {
    id: "POST-2026-0012",
    name: "Técnico Cordillera Demostración",
    kind: "Técnico",
    region: "Maule",
    commune: "Talca",
    specialty: "Climatización residencial",
    status: "En revisión",
    updated: "Hoy, 10:24",
    score: 78,
    emailVerified: true,
    phoneVerified: true,
    summary: "Perfil ficticio con experiencia declarada en instalación y mantención de equipos split.",
  },
  {
    id: "POST-2026-0011",
    name: "Frío Norte Empresa Ficticia",
    kind: "Empresa",
    region: "Antofagasta",
    commune: "Antofagasta",
    specialty: "Refrigeración comercial",
    status: "Enviada",
    updated: "Ayer, 17:42",
    score: 64,
    emailVerified: true,
    phoneVerified: false,
    summary: "Empresa demo orientada a cámaras de frío y mantención preventiva.",
  },
  {
    id: "POST-2026-0010",
    name: "Aire Claro Técnico Demo",
    kind: "Técnico",
    region: "Coquimbo",
    commune: "La Serena",
    specialty: "Aire acondicionado",
    status: "Cambios solicitados",
    updated: "10 jul, 09:15",
    score: 51,
    emailVerified: true,
    phoneVerified: true,
    summary: "Postulación ficticia pendiente de corregir el documento de identidad.",
  },
  {
    id: "POST-2026-0009",
    name: "Patagonia Frío Demo",
    kind: "Técnico",
    region: "Aysén",
    commune: "Coyhaique",
    specialty: "Refrigeración",
    status: "En revisión",
    updated: "9 jul, 14:08",
    score: 82,
    emailVerified: true,
    phoneVerified: true,
    summary: "Perfil demo con cobertura urbana y experiencia declarada en refrigeración.",
  },
  {
    id: "POST-2026-0008",
    name: "Servicios Térmicos Sur Prueba",
    kind: "Empresa",
    region: "Los Lagos",
    commune: "Puerto Montt",
    specialty: "Calefacción y climatización",
    status: "Aprobada",
    updated: "8 jul, 12:31",
    score: 91,
    emailVerified: true,
    phoneVerified: true,
    summary: "Empresa enteramente ficticia aprobada para probar los estados del panel.",
  },
];

export const adminProfessionals = [
  { id: "PRO-DEMO-0048", name: "Servicios Térmicos Sur Prueba", kind: "Empresa", region: "Los Lagos", status: "Publicado", score: 91, requests: 18, updated: "Hoy, 08:14" },
  { id: "PRO-DEMO-0047", name: "Clima Centro Técnico Ficticio", kind: "Técnico", region: "Metropolitana", status: "Publicado", score: 88, requests: 12, updated: "Ayer, 19:20" },
  { id: "PRO-DEMO-0046", name: "Eco Aire Demo", kind: "Empresa", region: "Valparaíso", status: "Cambios pendientes", score: 84, requests: 9, updated: "10 jul, 11:05" },
  { id: "PRO-DEMO-0045", name: "Refrigeración Ñuble Muestra", kind: "Técnico", region: "Ñuble", status: "Suspendido", score: 72, requests: 4, updated: "8 jul, 16:42" },
] as const;

export const adminDocuments = [
  { id: "DOC-DEMO-0219", owner: "Técnico Cordillera Demostración", type: "Cédula de identidad", status: "Por revisar", received: "Hoy, 10:18", expires: "No aplica" },
  { id: "DOC-DEMO-0218", owner: "Frío Norte Empresa Ficticia", type: "Título técnico en refrigeración", status: "Por revisar", received: "Ayer, 17:38", expires: "No aplica" },
  { id: "DOC-DEMO-0217", owner: "Aire Claro Técnico Demo", type: "Cédula de identidad", status: "Observado", received: "10 jul, 09:10", expires: "4 ene 2031" },
  { id: "DOC-DEMO-0216", owner: "Patagonia Frío Demo", type: "Capacitación en detección de fugas", status: "Aprobado", received: "9 jul, 13:58", expires: "No informado" },
] as const;

export const adminQualifications = [
  { id: "QUAL-ADMIN-001", owner: "Técnico Cordillera Demostración", type: "Título técnico", title: "Técnico en climatización y refrigeración", institution: "Instituto técnico ficticio", year: 2018, status: "Por revisar" },
  { id: "QUAL-ADMIN-002", owner: "Técnico Cordillera Demostración", type: "Capacitación", title: "Instalación segura de equipos split", institution: "Centro de formación demo", year: 2024, status: "Aprobado" },
  { id: "QUAL-ADMIN-003", owner: "Frío Norte Empresa Ficticia", type: "Capacitación", title: "Buenas prácticas de refrigeración comercial", institution: "Academia demostrativa", year: 2023, status: "Por revisar" },
] as const;

export const adminGalleryItems = [
  { id: "GAL-ADMIN-009", owner: "Técnico Cordillera Demostración", title: "Mantención de unidad mural", category: "Residencial", imageSrc: "/images/gallery/residencial-mantencion.webp", status: "Por revisar", received: "Hoy, 10:21" },
  { id: "GAL-ADMIN-008", owner: "Técnico Cordillera Demostración", title: "Unidad exterior en terraza", category: "Residencial", imageSrc: "/images/gallery/residencial-condensadora.webp", status: "Aprobada", received: "Hoy, 10:20" },
  { id: "GAL-ADMIN-007", owner: "Técnico Cordillera Demostración", title: "Instalación split terminada", category: "Residencial", imageSrc: "/images/gallery/residencial-split.webp", status: "Aprobada", received: "Hoy, 10:19" },
  { id: "GAL-ADMIN-006", owner: "Frío Norte Empresa Ficticia", title: "Sala de máquinas", category: "Industrial", imageSrc: "/images/gallery/industrial-sala-maquinas.webp", status: "Por revisar", received: "Ayer, 17:40" },
] as const;

export const adminRequests = [
  { id: "SOL-DEMO-0382", service: "Mantención split", commune: "Providencia", professional: "Clima Centro Técnico Ficticio", status: "Nueva", created: "Hoy, 11:42" },
  { id: "SOL-DEMO-0381", service: "Diagnóstico cámara de frío", commune: "Antofagasta", professional: "Frío Norte Empresa Ficticia", status: "Contactada", created: "Hoy, 09:16" },
  { id: "SOL-DEMO-0380", service: "Instalación aire acondicionado", commune: "Puerto Montt", professional: "Servicios Térmicos Sur Prueba", status: "Completada", created: "Ayer, 14:05" },
  { id: "SOL-DEMO-0379", service: "Reparación refrigerador", commune: "Chillán", professional: "Refrigeración Ñuble Muestra", status: "Cancelada", created: "10 jul, 18:34" },
] as const;

export const adminReviews = [
  { id: "EVA-DEMO-0098", professional: "Servicios Térmicos Sur Prueba", rating: 5, status: "Pendiente", excerpt: "Respuesta rápida y explicación clara del trabajo...", created: "Hoy, 08:35" },
  { id: "EVA-DEMO-0097", professional: "Clima Centro Técnico Ficticio", rating: 4, status: "Publicada", excerpt: "Cumplió el horario acordado y dejó todo ordenado...", created: "Ayer, 20:11" },
  { id: "EVA-DEMO-0096", professional: "Eco Aire Demo", rating: 2, status: "En revisión", excerpt: "La visita tuvo que reagendarse dos veces...", created: "10 jul, 16:24" },
] as const;

export const adminClaims = [
  { id: "REC-DEMO-0017", subject: "Disconformidad con información del perfil", related: "PRO-DEMO-0046", priority: "Alta", status: "Abierto", created: "Hoy, 09:02" },
  { id: "REC-DEMO-0016", subject: "Solicitud de retiro de evaluación", related: "EVA-DEMO-0096", priority: "Media", status: "Investigando", created: "Ayer, 15:48" },
  { id: "REC-DEMO-0015", subject: "Consulta por solicitud cerrada", related: "SOL-DEMO-0374", priority: "Baja", status: "Resuelto", created: "8 jul, 10:20" },
] as const;

export const adminAudit = [
  { id: "AUD-DEMO-1052", actor: "Moderador demo", action: "Inició revisión", resource: "POST-2026-0012", result: "Correcto", date: "Hoy, 10:31" },
  { id: "AUD-DEMO-1051", actor: "Sistema demo", action: "Marcó documento para revisión", resource: "DOC-DEMO-0219", result: "Correcto", date: "Hoy, 10:19" },
  { id: "AUD-DEMO-1050", actor: "Administrador demo", action: "Suspendió perfil", resource: "PRO-DEMO-0045", result: "Requiere motivo", date: "8 jul, 16:42" },
  { id: "AUD-DEMO-1049", actor: "Moderador demo", action: "Publicó evaluación", resource: "EVA-DEMO-0097", result: "Correcto", date: "7 jul, 12:08" },
] as const;

export function statusTone(status: string): AdminStatusTone {
  if (["Aprobada", "Aprobado", "Publicado", "Publicada", "Completada", "Resuelto", "Correcto"].includes(status)) return "success";
  if (["Rechazada", "Suspendido", "Cancelada", "Abierto", "Alta"].includes(status)) return "danger";
  if (["En revisión", "Cambios solicitados", "Cambios pendientes", "Observado", "Investigando", "Media", "Requiere motivo"].includes(status)) return "warning";
  if (["Enviada", "Por revisar", "Nueva", "Contactada", "Pendiente"].includes(status)) return "info";
  return "neutral";
}

export function getAdminApplication(id: string) {
  return adminApplications.find((application) => application.id === id);
}
