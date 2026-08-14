import { demoProfessionals, serviceCatalog } from "@/data/demo-professionals";
import type {
  ContactRequestStatus,
  Professional,
  ProfileStatus,
  Qualification,
  ReviewStatus,
} from "@/domain/directory";

/**
 * Datos locales para recorrer el panel profesional sin persistencia.
 *
 * Todos los nombres, contactos, documentos y solicitudes de este archivo son
 * ficticios. Los correos usan el dominio reservado `.invalid` y los teléfonos
 * están marcados explícitamente para evitar que se confundan con datos reales.
 */

export type DemoPanelSection =
  | "profile"
  | "services"
  | "coverage"
  | "documents"
  | "gallery"
  | "qualifications"
  | "requests"
  | "reviews"
  | "settings";

export type DemoServiceStatus = "active" | "paused" | "pending_review";
export type DemoDocumentStatus =
  | "approved"
  | "pending_review"
  | "changes_requested"
  | "expiring";
export type DemoGalleryStatus = "approved" | "pending_review" | "changes_requested";
export type DemoRequestActor = "customer" | "professional" | "system";

export interface DemoEditableProfessionalProfile {
  readonly id: string;
  readonly directorySlug: string;
  readonly kind: Professional["kind"];
  readonly status: ProfileStatus;
  readonly isDemo: true;
  displayName: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  email: string;
  phone: string;
  specialties: string[];
  yearsExperience: number;
  availability: Professional["availability"];
  responseTime: string;
  vehicle: boolean;
}

export interface DemoPanelService {
  readonly id: string;
  readonly isDemo: true;
  name: string;
  description: string;
  status: DemoServiceStatus;
  modalities: Professional["modalities"];
  indicativePrice: string;
  updatedAt: string;
}

export interface DemoPanelCoverage {
  readonly isDemo: true;
  region: string;
  communes: string[];
  modalities: Professional["modalities"];
  acceptsNearbyCommunes: boolean;
  travelNote: string;
}

export interface DemoPanelDocument {
  readonly id: string;
  readonly isDemo: true;
  type: "identity" | "technical_certificate" | "other";
  name: string;
  fileName: string;
  status: DemoDocumentStatus;
  uploadedAt: string;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  reviewNote: string;
}

export interface DemoPanelGalleryItem {
  readonly id: string;
  readonly isDemo: true;
  title: string;
  caption: string;
  category: string;
  imageSrc: string;
  alt: string;
  position: number;
  status: DemoGalleryStatus;
  uploadedAt: string;
}

export interface DemoPanelQualification extends Qualification {
  readonly isDemo: true;
  documentName: string;
  reviewNote: string;
}

export interface DemoCustomer {
  readonly id: string;
  readonly isDemo: true;
  displayName: string;
  email: string;
  phone: string;
  commune: string;
}

export interface DemoRequestTransition {
  readonly id: string;
  status: ContactRequestStatus;
  actor: DemoRequestActor;
  occurredAt: string;
  note: string;
}

export interface DemoProfessionalRequest {
  readonly id: string;
  readonly isDemo: true;
  service: string;
  description: string;
  status: ContactRequestStatus;
  createdAt: string;
  preferredContact: "email" | "phone" | "either";
  customer: DemoCustomer;
  history: readonly DemoRequestTransition[];
}

export interface DemoPanelReview {
  readonly id: string;
  readonly isDemo: true;
  readonly requestId: string;
  status: ReviewStatus;
  customerDisplayName: string;
  rating: number;
  comment: string;
  submittedAt: string;
  publishedAt: string | null;
  professionalReply: string | null;
}

export interface DemoPanelPreferences {
  readonly isDemo: true;
  notifications: {
    newRequestEmail: boolean;
    requestStatusEmail: boolean;
    reviewEmail: boolean;
    documentExpiryEmail: boolean;
    digest: "off" | "daily" | "weekly";
  };
  availability: {
    acceptingRequests: boolean;
    emergencyRequests: boolean;
    scheduleNote: string;
  };
  privacy: {
    contactVisibility: "after_valid_request";
    showLastName: boolean;
    showExactAddress: false;
  };
}

export interface DemoPanelAccountSettings {
  readonly isDemo: true;
  loginEmail: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorStatus: "not_configured" | "configured";
  consentVersion: string;
  consentAcceptedAt: string;
  dataSource: "fixtures";
}

export interface DemoPanelSummary {
  readonly isDemo: true;
  profileScore: number;
  monthlyViews: number;
  newRequests: number;
  documentsExpiringSoon: number;
  publishedReviews: number;
  averageRating: number;
}

export interface DemoProfessionalPanelData {
  readonly notice: string;
  readonly professional: Professional;
  readonly profile: DemoEditableProfessionalProfile;
  readonly services: readonly DemoPanelService[];
  readonly coverage: DemoPanelCoverage;
  readonly documents: readonly DemoPanelDocument[];
  readonly gallery: readonly DemoPanelGalleryItem[];
  readonly qualifications: readonly DemoPanelQualification[];
  readonly requests: readonly DemoProfessionalRequest[];
  readonly reviews: readonly DemoPanelReview[];
  readonly preferences: DemoPanelPreferences;
  readonly account: DemoPanelAccountSettings;
  readonly summary: DemoPanelSummary;
}

export const demoPanelProfessional =
  demoProfessionals.find((professional) => professional.slug === "tecnico-austral-ejemplo") ??
  demoProfessionals[0]!;

export const demoEditableProfile: DemoEditableProfessionalProfile = {
  id: demoPanelProfessional.id,
  directorySlug: demoPanelProfessional.slug,
  kind: demoPanelProfessional.kind,
  status: demoPanelProfessional.status,
  isDemo: true,
  displayName: demoPanelProfessional.displayName,
  firstName: "Técnico",
  lastName: "Austral Ejemplo",
  headline: demoPanelProfessional.headline,
  summary: demoPanelProfessional.summary,
  email: "tecnico.austral@ejemplo.invalid",
  phone: "+56 9 0000 0002 · número ficticio",
  specialties: [...demoPanelProfessional.specialties],
  yearsExperience: demoPanelProfessional.yearsExperience,
  availability: demoPanelProfessional.availability,
  responseTime: demoPanelProfessional.responseTime,
  vehicle: demoPanelProfessional.vehicle,
};

export const demoPanelServices: readonly DemoPanelService[] = [
  {
    id: "SERVICE-DEMO-001",
    isDemo: true,
    name: serviceCatalog[2],
    description: "Diagnóstico y reparación demostrativa de equipos residenciales.",
    status: "active",
    modalities: ["Domiciliaria", "Comercial"],
    indicativePrice: "Valor a convenir · ejemplo",
    updatedAt: "2026-07-12T18:30:00.000Z",
  },
  {
    id: "SERVICE-DEMO-002",
    isDemo: true,
    name: serviceCatalog[4],
    description: "Evaluación ficticia de fallas y propuesta de próximos pasos.",
    status: "active",
    modalities: ["Domiciliaria", "Comercial"],
    indicativePrice: "Desde $25.000 · monto ficticio",
    updatedAt: "2026-07-10T14:20:00.000Z",
  },
  {
    id: "SERVICE-DEMO-003",
    isDemo: true,
    name: serviceCatalog[10],
    description: "Prueba de hermeticidad representada únicamente para la demostración.",
    status: "pending_review",
    modalities: ["Comercial"],
    indicativePrice: "Cotización previa · ejemplo",
    updatedAt: "2026-07-13T12:05:00.000Z",
  },
  {
    id: "SERVICE-DEMO-004",
    isDemo: true,
    name: serviceCatalog[11],
    description: "Servicio pausado para demostrar la administración del catálogo.",
    status: "paused",
    modalities: ["Taller"],
    indicativePrice: "No disponible · ejemplo",
    updatedAt: "2026-06-28T09:40:00.000Z",
  },
];

export const demoPanelCoverage: DemoPanelCoverage = {
  isDemo: true,
  region: demoPanelProfessional.region,
  communes: [...demoPanelProfessional.communes],
  modalities: [...demoPanelProfessional.modalities],
  acceptsNearbyCommunes: true,
  travelNote: "Cobertura ficticia sujeta a agenda y condiciones climáticas de ejemplo.",
};

export const demoPanelDocuments: readonly DemoPanelDocument[] = [
  {
    id: "DOC-DEMO-PRO-001",
    isDemo: true,
    type: "identity",
    name: "Verificación de identidad de demostración",
    fileName: "identidad-ficticia-demo.pdf",
    status: "approved",
    uploadedAt: "2026-04-08T13:15:00.000Z",
    expiresAt: null,
    daysUntilExpiry: null,
    reviewNote: "Documento simulado aprobado para mostrar el flujo. No contiene una identidad real.",
  },
  {
    id: "DOC-DEMO-PRO-002",
    isDemo: true,
    type: "technical_certificate",
    name: "Certificado técnico ficticio",
    fileName: "certificado-tecnico-ficticio.pdf",
    status: "expiring",
    uploadedAt: "2025-08-27T16:42:00.000Z",
    expiresAt: "2026-08-27",
    daysUntilExpiry: 45,
    reviewNote: "Ejemplo de alerta: renovar antes del 27 de agosto de 2026.",
  },
  {
    id: "DOC-DEMO-PRO-004",
    isDemo: true,
    type: "other",
    name: "Comprobante de capacitación de muestra",
    fileName: "capacitacion-incompleta-demo.pdf",
    status: "changes_requested",
    uploadedAt: "2026-07-01T11:03:00.000Z",
    expiresAt: null,
    daysUntilExpiry: null,
    reviewNote: "Ejemplo: reemplazar por una copia legible que muestre la fecha de emisión.",
  },
];

export const demoPanelGallery: readonly DemoPanelGalleryItem[] = [
  {
    id: "GALLERY-DEMO-001",
    isDemo: true,
    title: "Vitrinas refrigeradas",
    caption: "Instalación comercial ilustrativa, sin cliente ni ubicación real.",
    category: "Refrigeración comercial",
    imageSrc: "/images/gallery/comercial-vitrinas.webp",
    alt: "Vitrinas refrigeradas ficticias instaladas en un comercio",
    position: 1,
    status: "approved",
    uploadedAt: "2026-05-19T14:30:00.000Z",
  },
  {
    id: "GALLERY-DEMO-002",
    isDemo: true,
    title: "Línea de frío gastronómico",
    caption: "Equipamiento ilustrativo para mostrar una galería profesional.",
    category: "Gastronomía",
    imageSrc: "/images/gallery/comercial-cocina.webp",
    alt: "Equipos frigoríficos ficticios en una cocina comercial",
    position: 2,
    status: "approved",
    uploadedAt: "2026-05-22T17:10:00.000Z",
  },
  {
    id: "GALLERY-DEMO-003",
    isDemo: true,
    title: "Unidad condensadora comercial",
    caption: "Elemento ilustrativo pendiente para demostrar el proceso de revisión.",
    category: "Refrigeración comercial",
    imageSrc: "/images/gallery/comercial-condensadora.webp",
    alt: "Unidad condensadora comercial ficticia con tuberías protegidas",
    position: 3,
    status: "pending_review",
    uploadedAt: "2026-07-12T20:05:00.000Z",
  },
];

export const demoPanelQualifications: readonly DemoPanelQualification[] = [
  {
    id: "QUAL-DEMO-PANEL-001",
    isDemo: true,
    type: "training",
    title: "Refrigeración aplicada y detección de fugas",
    institution: "Centro de capacitación ficticio",
    issuedYear: 2019,
    status: "reviewed",
    reviewedAt: "Revisado en mayo de 2026",
    documentName: "capacitacion-refrigeracion-demo.pdf",
    reviewNote: "Respaldo ficticio revisado para mostrar el estado público.",
  },
  {
    id: "QUAL-DEMO-PANEL-002",
    isDemo: true,
    type: "technical_degree",
    title: "Técnico en mantenimiento de sistemas térmicos",
    institution: "Instituto técnico de demostración",
    issuedYear: 2017,
    status: "pending_review",
    reviewedAt: "Pendiente de revisión",
    documentName: "titulo-tecnico-demo.pdf",
    reviewNote: "Metadato ficticio en espera de moderación.",
  },
];

export const demoRequestTransitions = {
  new: ["viewed", "rejected", "expired"],
  viewed: ["contacted", "rejected", "expired"],
  contacted: ["accepted", "rejected", "cancelled", "expired"],
  accepted: ["completed", "cancelled"],
  rejected: [],
  completed: [],
  cancelled: [],
  expired: [],
} as const satisfies Record<ContactRequestStatus, readonly ContactRequestStatus[]>;

export const demoPanelRequests: readonly DemoProfessionalRequest[] = [
  {
    id: "SOL-DEMO-0004",
    isDemo: true,
    service: serviceCatalog[1],
    description: "Solicitud ficticia para mantención preventiva de un equipo mural de demostración.",
    status: "new",
    createdAt: "2026-07-13T12:40:00.000Z",
    preferredContact: "email",
    customer: {
      id: "CUSTOMER-DEMO-004",
      isDemo: true,
      displayName: "Cliente Demo Cuatro",
      email: "cliente.cuatro@ejemplo.invalid",
      phone: "+56 9 0000 0104 · ficticio, no llamar",
      commune: "Punta Arenas",
    },
    history: [
      {
        id: "TRANSITION-DEMO-004-01",
        status: "new",
        actor: "customer",
        occurredAt: "2026-07-13T12:40:00.000Z",
        note: "Solicitud de demostración creada.",
      },
    ],
  },
  {
    id: "SOL-DEMO-0003",
    isDemo: true,
    service: serviceCatalog[4],
    description: "Ejemplo de diagnóstico para un equipo que no inicia.",
    status: "viewed",
    createdAt: "2026-07-12T15:18:00.000Z",
    preferredContact: "phone",
    customer: {
      id: "CUSTOMER-DEMO-003",
      isDemo: true,
      displayName: "Cliente Demo Tres",
      email: "cliente.tres@ejemplo.invalid",
      phone: "+56 9 0000 0103 · ficticio, no llamar",
      commune: "Natales",
    },
    history: [
      {
        id: "TRANSITION-DEMO-003-01",
        status: "new",
        actor: "customer",
        occurredAt: "2026-07-12T15:18:00.000Z",
        note: "Solicitud de demostración creada.",
      },
      {
        id: "TRANSITION-DEMO-003-02",
        status: "viewed",
        actor: "professional",
        occurredAt: "2026-07-12T16:02:00.000Z",
        note: "El profesional ficticio revisó la solicitud.",
      },
    ],
  },
  {
    id: "SOL-DEMO-0002",
    isDemo: true,
    service: serviceCatalog[2],
    description: "Caso ficticio de reparación con visita de ejemplo coordinada.",
    status: "accepted",
    createdAt: "2026-07-09T13:25:00.000Z",
    preferredContact: "either",
    customer: {
      id: "CUSTOMER-DEMO-002",
      isDemo: true,
      displayName: "Cliente Demo Dos",
      email: "cliente.dos@ejemplo.invalid",
      phone: "+56 9 0000 0102 · ficticio, no llamar",
      commune: "Punta Arenas",
    },
    history: [
      {
        id: "TRANSITION-DEMO-002-01",
        status: "new",
        actor: "customer",
        occurredAt: "2026-07-09T13:25:00.000Z",
        note: "Solicitud de demostración creada.",
      },
      {
        id: "TRANSITION-DEMO-002-02",
        status: "viewed",
        actor: "professional",
        occurredAt: "2026-07-09T14:05:00.000Z",
        note: "Solicitud ficticia revisada.",
      },
      {
        id: "TRANSITION-DEMO-002-03",
        status: "contacted",
        actor: "professional",
        occurredAt: "2026-07-09T14:22:00.000Z",
        note: "Contacto de demostración registrado, sin comunicación real.",
      },
      {
        id: "TRANSITION-DEMO-002-04",
        status: "accepted",
        actor: "customer",
        occurredAt: "2026-07-09T16:10:00.000Z",
        note: "Visita ficticia aceptada para el ejemplo.",
      },
    ],
  },
  {
    id: "SOL-DEMO-0001",
    isDemo: true,
    service: serviceCatalog[10],
    description: "Solicitud completada de muestra para habilitar una evaluación demostrativa.",
    status: "completed",
    createdAt: "2026-06-18T11:05:00.000Z",
    preferredContact: "email",
    customer: {
      id: "CUSTOMER-DEMO-001",
      isDemo: true,
      displayName: "Cliente Demo Uno",
      email: "cliente.uno@ejemplo.invalid",
      phone: "+56 9 0000 0101 · ficticio, no llamar",
      commune: "Natales",
    },
    history: [
      {
        id: "TRANSITION-DEMO-001-01",
        status: "new",
        actor: "customer",
        occurredAt: "2026-06-18T11:05:00.000Z",
        note: "Solicitud de demostración creada.",
      },
      {
        id: "TRANSITION-DEMO-001-02",
        status: "viewed",
        actor: "professional",
        occurredAt: "2026-06-18T12:40:00.000Z",
        note: "Solicitud ficticia revisada.",
      },
      {
        id: "TRANSITION-DEMO-001-03",
        status: "contacted",
        actor: "professional",
        occurredAt: "2026-06-18T13:02:00.000Z",
        note: "Contacto de demostración registrado.",
      },
      {
        id: "TRANSITION-DEMO-001-04",
        status: "accepted",
        actor: "customer",
        occurredAt: "2026-06-18T17:30:00.000Z",
        note: "Atención ficticia aceptada.",
      },
      {
        id: "TRANSITION-DEMO-001-05",
        status: "completed",
        actor: "professional",
        occurredAt: "2026-06-21T19:15:00.000Z",
        note: "Trabajo de demostración marcado como completado.",
      },
    ],
  },
];

export const demoPanelReviews: readonly DemoPanelReview[] = [
  {
    id: "REVIEW-DEMO-001",
    isDemo: true,
    requestId: "SOL-DEMO-0001",
    status: "published",
    customerDisplayName: "Cliente Demo Uno",
    rating: 5,
    comment: "Evaluación ficticia: comunicación clara y atención ordenada.",
    submittedAt: "2026-06-22T15:10:00.000Z",
    publishedAt: "2026-06-23T12:00:00.000Z",
    professionalReply: "Respuesta de ejemplo: gracias por evaluar esta atención ficticia.",
  },
  {
    id: "REVIEW-DEMO-HISTORIC-002",
    isDemo: true,
    requestId: "SOL-DEMO-HISTORIC-002",
    status: "published",
    customerDisplayName: "Cliente Demo Histórico",
    rating: 4,
    comment: "Evaluación de muestra para visualizar el historial del perfil.",
    submittedAt: "2026-05-17T18:20:00.000Z",
    publishedAt: "2026-05-18T13:45:00.000Z",
    professionalReply: null,
  },
  {
    id: "REVIEW-DEMO-PENDING-003",
    isDemo: true,
    requestId: "SOL-DEMO-HISTORIC-003",
    status: "pending",
    customerDisplayName: "Cliente Demo Pendiente",
    rating: 5,
    comment: "Evaluación completamente ficticia a la espera de moderación.",
    submittedAt: "2026-07-12T21:10:00.000Z",
    publishedAt: null,
    professionalReply: null,
  },
];

export const demoPanelPreferences: DemoPanelPreferences = {
  isDemo: true,
  notifications: {
    newRequestEmail: true,
    requestStatusEmail: true,
    reviewEmail: true,
    documentExpiryEmail: true,
    digest: "daily",
  },
  availability: {
    acceptingRequests: true,
    emergencyRequests: false,
    scheduleNote: "Agenda ficticia: lunes a viernes, de 09:00 a 18:00.",
  },
  privacy: {
    contactVisibility: "after_valid_request",
    showLastName: false,
    showExactAddress: false,
  },
};

export const demoPanelAccount: DemoPanelAccountSettings = {
  isDemo: true,
  loginEmail: "tecnico.austral@ejemplo.invalid",
  emailVerified: true,
  phoneVerified: true,
  twoFactorStatus: "not_configured",
  consentVersion: "demo-terms-v1",
  consentAcceptedAt: "2026-04-08T13:00:00.000Z",
  dataSource: "fixtures",
};

const publishedDemoReviews = demoPanelReviews.filter((review) => review.status === "published");
const publishedRatingTotal = publishedDemoReviews.reduce((total, review) => total + review.rating, 0);

export const demoPanelSummary: DemoPanelSummary = {
  isDemo: true,
  profileScore: demoPanelProfessional.score,
  monthlyViews: 128,
  newRequests: demoPanelRequests.filter((request) => request.status === "new").length,
  documentsExpiringSoon: demoPanelDocuments.filter((document) => document.status === "expiring")
    .length,
  publishedReviews: publishedDemoReviews.length,
  averageRating:
    publishedDemoReviews.length === 0
      ? 0
      : Number((publishedRatingTotal / publishedDemoReviews.length).toFixed(1)),
};

export const demoProfessionalPanel: DemoProfessionalPanelData = {
  notice:
    "Demostración local: todos los perfiles, clientes, contactos, documentos, solicitudes y evaluaciones son ficticios.",
  professional: demoPanelProfessional,
  profile: demoEditableProfile,
  services: demoPanelServices,
  coverage: demoPanelCoverage,
  documents: demoPanelDocuments,
  gallery: demoPanelGallery,
  qualifications: demoPanelQualifications,
  requests: demoPanelRequests,
  reviews: demoPanelReviews,
  preferences: demoPanelPreferences,
  account: demoPanelAccount,
  summary: demoPanelSummary,
};
