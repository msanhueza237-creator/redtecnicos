import type { ProfessionalCategory } from "@/domain/directory";
import type { professionalServices } from "@/domain/professional-registration";

type ProfessionalService = (typeof professionalServices)[number];

export interface OrganicFaq {
  question: string;
  answer: string;
}

export interface ServiceLandingPage {
  slug: string;
  eyebrow: string;
  shortTitle: string;
  title: string;
  description: string;
  introduction: string;
  service: ProfessionalService;
  category: ProfessionalCategory;
  comparisonPoints: string[];
  requestChecklist: string[];
  faqs: OrganicFaq[];
  relatedGuideSlugs: string[];
  updatedAt: string;
}

export interface GuideSection {
  title: string;
  paragraphs: string[];
  items?: string[];
}

export interface OrganicGuide {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  introduction: string;
  readTime: string;
  publishedAt: string;
  updatedAt: string;
  serviceSlug?: string;
  sections: GuideSection[];
  source?: {
    label: string;
    href: string;
  };
}

export const serviceLandingPages: readonly ServiceLandingPage[] = [
  {
    slug: "instalacion-aire-acondicionado",
    eyebrow: "Climatización residencial y comercial",
    shortTitle: "Instalación de aire acondicionado",
    title: "Técnicos para instalación de aire acondicionado en Chile",
    description:
      "Compara perfiles con cobertura en tu comuna para instalar aire acondicionado: experiencia, servicios, trabajos publicados e información revisada.",
    introduction:
      "Encuentra técnicos y empresas que declaran realizar instalaciones de aire acondicionado. Revisa su cobertura y antecedentes antes de solicitar contacto y acordar una visita o presupuesto directamente.",
    service: "Instalación de aire acondicionado",
    category: "residential",
    comparisonPoints: [
      "Comunas y modalidades de atención declaradas.",
      "Experiencia, formación revisada y trabajos publicados cuando estén disponibles.",
      "Evaluaciones vinculadas a solicitudes completadas.",
      "Disponibilidad informada por cada profesional.",
    ],
    requestChecklist: [
      "Comuna y tipo de inmueble.",
      "Marca, modelo y capacidad del equipo, si ya lo compraste.",
      "Fotografías de los espacios interior y exterior sin exponer datos privados.",
      "Distancia aproximada entre unidades y restricciones del edificio o condominio.",
    ],
    faqs: [
      {
        question: "¿Red Técnicos Chile realiza la instalación?",
        answer:
          "No. La plataforma permite consultar perfiles y solicitar contacto. El alcance, precio, ejecución y garantía se acuerdan directamente con el profesional.",
      },
      {
        question: "¿Qué conviene confirmar antes de aceptar un presupuesto?",
        answer:
          "Pide que el presupuesto identifique el equipo, materiales incluidos, ubicación de las unidades, trabajos eléctricos asociados, plazo y condiciones de garantía.",
      },
      {
        question: "¿Puedo buscar por región o comuna?",
        answer:
          "Sí. Cada perfil publicado declara su región y comunas de cobertura; la disponibilidad final debe confirmarse directamente.",
      },
    ],
    relatedGuideSlugs: [
      "como-elegir-tecnico-refrigeracion-climatizacion",
      "como-redactar-solicitud-servicio-tecnico",
    ],
    updatedAt: "2026-08-17",
  },
  {
    slug: "mantencion-aire-acondicionado",
    eyebrow: "Cuidado preventivo y diagnóstico",
    shortTitle: "Mantención de aire acondicionado",
    title: "Técnicos para mantención de aire acondicionado en Chile",
    description:
      "Busca técnicos para mantención de aire acondicionado y compara cobertura, experiencia, antecedentes y evaluaciones antes de solicitar contacto.",
    introduction:
      "Compara perfiles que declaran realizar mantención de aire acondicionado para hogares, oficinas y comercios. Describe los síntomas del equipo para recibir una respuesta mejor contextualizada.",
    service: "Mantención de aire acondicionado",
    category: "residential",
    comparisonPoints: [
      "Tipo de equipos y servicios que declara atender cada perfil.",
      "Cobertura territorial y modalidades de atención.",
      "Experiencia, formación y fotografías que hayan sido aprobadas para publicación.",
      "Evaluaciones moderadas de solicitudes completadas.",
    ],
    requestChecklist: [
      "Marca, modelo y antigüedad aproximada del equipo.",
      "Síntoma principal: poco caudal, ruido, olor, filtración o código de error.",
      "Fecha de la última mantención, si la conoces.",
      "Uso aproximado y tipo de espacio que climatiza.",
    ],
    faqs: [
      {
        question: "¿Cada cuánto debe hacerse la mantención?",
        answer:
          "Depende del fabricante, las horas de uso y el ambiente. Revisa el manual del equipo y solicita una evaluación si observas pérdida de rendimiento, ruido, olores o filtraciones.",
      },
      {
        question: "¿Una carga de refrigerante es una mantención rutinaria?",
        answer:
          "No debería asumirse automáticamente. El circuito requiere diagnóstico; pide que el profesional explique la causa y el trabajo propuesto antes de autorizarlo.",
      },
      {
        question: "¿El directorio fija precios?",
        answer:
          "No. Cada profesional define su visita, diagnóstico y presupuesto. Conviene solicitar el alcance por escrito antes del trabajo.",
      },
    ],
    relatedGuideSlugs: [
      "senales-mantencion-aire-acondicionado",
      "como-elegir-tecnico-refrigeracion-climatizacion",
    ],
    updatedAt: "2026-08-17",
  },
  {
    slug: "refrigeracion-comercial",
    eyebrow: "Comercio, gastronomía y conservación",
    shortTitle: "Refrigeración comercial",
    title: "Técnicos de refrigeración comercial en Chile",
    description:
      "Encuentra técnicos y empresas de refrigeración comercial para vitrinas, equipos gastronómicos y sistemas de conservación en Chile.",
    introduction:
      "Consulta perfiles que declaran experiencia en refrigeración comercial. Compara cobertura y especialidades para contactar a quien tenga mejor contexto sobre tu instalación.",
    service: "Refrigeración comercial",
    category: "commercial",
    comparisonPoints: [
      "Experiencia declarada en instalaciones comerciales.",
      "Especialidades, servicios y formación visibles en el perfil.",
      "Cobertura y disponibilidad informadas.",
      "Trabajos publicados y evaluaciones vinculadas cuando existan.",
    ],
    requestChecklist: [
      "Tipo de equipo o instalación y uso del negocio.",
      "Marca, modelo y temperatura esperada.",
      "Síntoma, código de error y momento en que comenzó.",
      "Nivel de urgencia y medidas operativas ya adoptadas.",
    ],
    faqs: [
      {
        question: "¿Puedo solicitar atención urgente?",
        answer:
          "Puedes describir la urgencia en la solicitud. La disponibilidad y el tiempo de respuesta deben confirmarse directamente con el profesional.",
      },
      {
        question: "¿Qué información ayuda a diagnosticar mejor?",
        answer:
          "Indica equipo, marca, modelo, temperatura observada, alarmas, ruidos y cambios recientes. No manipules componentes eléctricos ni refrigerantes.",
      },
      {
        question: "¿Red Técnicos Chile supervisa el trabajo?",
        answer:
          "No. El directorio registra la solicitud de contacto, pero la evaluación, contratación y ejecución ocurren directamente entre las partes.",
      },
    ],
    relatedGuideSlugs: [
      "como-redactar-solicitud-servicio-tecnico",
      "como-elegir-tecnico-refrigeracion-climatizacion",
    ],
    updatedAt: "2026-08-17",
  },
  {
    slug: "camaras-de-frio",
    eyebrow: "Conservación y frío industrial",
    shortTitle: "Cámaras de frío",
    title: "Técnicos para cámaras de frío en Chile",
    description:
      "Compara técnicos y empresas que declaran atender cámaras de frío: cobertura, experiencia, especialidades y antecedentes publicados.",
    introduction:
      "Encuentra perfiles con servicios declarados para cámaras de frío y sistemas de conservación. Entrega información operacional clara sin intervenir el equipo por tu cuenta.",
    service: "Cámaras de frío",
    category: "industrial",
    comparisonPoints: [
      "Experiencia declarada en refrigeración industrial o comercial.",
      "Especialidades y formación revisada que estén visibles.",
      "Región, comunas de cobertura y modalidad de atención.",
      "Trabajos publicados y evaluaciones asociadas a solicitudes.",
    ],
    requestChecklist: [
      "Uso de la cámara, temperatura objetivo y lectura actual.",
      "Tipo de controlador, alarmas o códigos visibles.",
      "Cuándo comenzó la desviación y si es continua o intermitente.",
      "Impacto operativo y protocolo interno de resguardo del producto.",
    ],
    faqs: [
      {
        question: "¿Qué hago si la temperatura está fuera de rango?",
        answer:
          "Aplica el protocolo de inocuidad o conservación de tu operación, limita aperturas innecesarias y solicita diagnóstico. No manipules tableros, presiones ni refrigerantes sin personal competente.",
      },
      {
        question: "¿Conviene enviar fotos?",
        answer:
          "Sí, si no revelan datos sensibles: placa del equipo, controlador, códigos y estado exterior pueden ayudar a contextualizar la solicitud.",
      },
      {
        question: "¿El perfil publicado garantiza disponibilidad?",
        answer:
          "No. La cobertura y disponibilidad son declaradas por el perfil y deben confirmarse al momento del contacto.",
      },
    ],
    relatedGuideSlugs: [
      "senales-servicio-tecnico-camara-frio",
      "como-redactar-solicitud-servicio-tecnico",
    ],
    updatedAt: "2026-08-17",
  },
] as const;

export const organicGuides: readonly OrganicGuide[] = [
  {
    slug: "como-elegir-tecnico-refrigeracion-climatizacion",
    eyebrow: "Guía para clientes",
    title: "Cómo elegir un técnico de refrigeración o climatización",
    description:
      "Una lista práctica para comparar técnicos de refrigeración y climatización antes de solicitar un presupuesto o autorizar un trabajo.",
    introduction:
      "Una buena decisión no depende de una sola insignia o del precio más bajo. Conviene comparar el alcance, la experiencia relevante y la claridad con que el profesional explica el diagnóstico.",
    readTime: "5 min de lectura",
    publishedAt: "2026-08-17",
    updatedAt: "2026-08-17",
    sections: [
      {
        title: "1. Parte por el tipo de instalación",
        paragraphs: [
          "No todos los perfiles trabajan con los mismos equipos. Una instalación split residencial, una vitrina comercial y una cámara de conservación requieren experiencias distintas.",
          "Busca servicios y trabajos relacionados con tu necesidad, y confirma que el profesional cubra tu comuna antes de avanzar.",
        ],
      },
      {
        title: "2. Describe el problema antes de pedir precio",
        paragraphs: [
          "Un mensaje con marca, modelo, síntomas, códigos y contexto permite evaluar mejor la visita. Evita pedir una solución cerrada antes de que exista diagnóstico.",
        ],
        items: [
          "Indica desde cuándo ocurre y si la falla es continua.",
          "Incluye fotografías seguras de la placa y del equipo.",
          "Explica el uso del espacio y el nivel de urgencia.",
          "No compartas contraseñas, documentos de identidad ni imágenes de personas sin permiso.",
        ],
      },
      {
        title: "3. Compara el alcance por escrito",
        paragraphs: [
          "Dos presupuestos con precios distintos pueden incluir trabajos diferentes. Solicita una descripción de mano de obra, materiales, pruebas, plazo y condiciones de garantía.",
          "Si el diagnóstico cambia durante el trabajo, pide que expliquen el nuevo alcance antes de autorizar costos adicionales.",
        ],
      },
      {
        title: "4. Revisa señales, pero entiende sus límites",
        paragraphs: [
          "Formación, experiencia, trabajos publicados y evaluaciones aportan contexto. Ninguno de esos elementos garantiza por sí solo el resultado futuro.",
          "Elige con información suficiente, conserva el presupuesto y acuerda directamente quién responderá ante observaciones posteriores.",
        ],
      },
    ],
  },
  {
    slug: "senales-mantencion-aire-acondicionado",
    eyebrow: "Climatización",
    title: "Señales de que tu aire acondicionado necesita mantención",
    description:
      "Reconoce señales comunes de mantención o diagnóstico en un aire acondicionado y prepara una solicitud útil para el servicio técnico.",
    introduction:
      "Menor caudal, olores, ruidos o filtraciones justifican revisar el equipo. La causa no siempre es la misma, por lo que conviene registrar los síntomas y evitar intervenciones improvisadas.",
    readTime: "4 min de lectura",
    publishedAt: "2026-08-17",
    updatedAt: "2026-08-17",
    serviceSlug: "mantencion-aire-acondicionado",
    sections: [
      {
        title: "Señales que conviene observar",
        paragraphs: [
          "Toma nota de cambios respecto del funcionamiento habitual. Esa comparación aporta más contexto que una descripción genérica como “no enfría”.",
        ],
        items: [
          "Menor flujo de aire o demora inusual para alcanzar la temperatura.",
          "Ruido, vibración u olor que antes no estaba presente.",
          "Agua o humedad fuera de los puntos normales de drenaje.",
          "Encendidos y apagados repetidos o códigos de error.",
          "Aumento de consumo que coincide con un cambio de rendimiento.",
        ],
      },
      {
        title: "Qué puedes revisar de forma segura",
        paragraphs: [
          "Consulta el manual del fabricante, verifica que no haya objetos bloqueando el flujo y registra el código visible. Si el equipo presenta olor a quemado, chispa o riesgo eléctrico, apágalo de forma segura y pide asistencia.",
          "No abras tableros, no intervengas tuberías y no asumas que una carga de refrigerante resolverá el problema. Esa decisión requiere diagnóstico y manejo competente.",
        ],
      },
      {
        title: "Cómo preparar la solicitud",
        paragraphs: [
          "Incluye marca, modelo, antigüedad aproximada, fecha de la última mantención, síntomas y fotografías que no expongan información privada.",
          "Pide que el presupuesto distinga diagnóstico, limpieza, reparación, repuestos y pruebas finales cuando correspondan.",
        ],
      },
    ],
    source: {
      label: "Manual de Buenas Prácticas en Refrigeración y Climatización — Ministerio del Medio Ambiente",
      href: "https://ozono.mma.gob.cl/manual-de-buenas-practicas-en-sistemas-de-refrigeracion-y-climatizacion/",
    },
  },
  {
    slug: "senales-servicio-tecnico-camara-frio",
    eyebrow: "Refrigeración comercial e industrial",
    title: "Cuándo solicitar servicio técnico para una cámara de frío",
    description:
      "Señales operativas para solicitar diagnóstico de una cámara de frío y datos que conviene entregar al técnico desde el primer contacto.",
    introduction:
      "Una desviación de temperatura puede afectar la operación y el producto almacenado. Activa primero el protocolo interno de conservación y reúne datos del sistema para solicitar asistencia.",
    readTime: "5 min de lectura",
    publishedAt: "2026-08-17",
    updatedAt: "2026-08-17",
    serviceSlug: "camaras-de-frio",
    sections: [
      {
        title: "Señales que requieren evaluación",
        paragraphs: [
          "Compara la temperatura objetivo con la lectura y registra la hora. Una sola observación no explica la causa, pero permite establecer una línea de tiempo.",
        ],
        items: [
          "Temperatura fuera del rango operacional o recuperación demasiado lenta.",
          "Alarmas, códigos o ciclos de encendido distintos de lo habitual.",
          "Escarcha, condensación, ruido o vibración inusual.",
          "Daño visible en puertas, sellos o componentes exteriores.",
          "Pérdida de rendimiento después de un corte o intervención reciente.",
        ],
      },
      {
        title: "Protege primero la operación",
        paragraphs: [
          "Sigue el procedimiento de inocuidad, trazabilidad o conservación aplicable a tu negocio. Limita aperturas innecesarias y registra temperaturas y tiempos.",
          "No manipules protecciones eléctricas, presiones ni refrigerantes. Informa si existe riesgo eléctrico, ruido severo u olor anormal para que el profesional evalúe las precauciones de la visita.",
        ],
      },
      {
        title: "Datos para un contacto más eficiente",
        paragraphs: [
          "Envía tipo de cámara, temperatura objetivo y actual, controlador, códigos, marca, modelo y cambios recientes. Agrega la comuna y el nivel de urgencia real.",
          "Solicita que diagnóstico, repuestos, mano de obra, pruebas y condiciones de seguimiento queden diferenciados por escrito.",
        ],
      },
    ],
    source: {
      label: "Manual de Buenas Prácticas en Refrigeración y Climatización — Ministerio del Medio Ambiente",
      href: "https://ozono.mma.gob.cl/manual-de-buenas-practicas-en-sistemas-de-refrigeracion-y-climatizacion/",
    },
  },
  {
    slug: "como-redactar-solicitud-servicio-tecnico",
    eyebrow: "Contacto más efectivo",
    title: "Cómo redactar una solicitud de servicio técnico útil",
    description:
      "Plantilla breve para pedir servicio técnico de refrigeración o climatización con la información necesaria y sin exponer datos privados.",
    introduction:
      "Una solicitud clara reduce preguntas iniciales y ayuda al profesional a decidir si tiene la experiencia, cobertura y disponibilidad adecuadas.",
    readTime: "3 min de lectura",
    publishedAt: "2026-08-17",
    updatedAt: "2026-08-17",
    sections: [
      {
        title: "La información mínima",
        paragraphs: [
          "Empieza por el tipo de equipo, ubicación general, síntoma y urgencia. Si conoces la marca y el modelo, inclúyelos tal como aparecen en la placa.",
        ],
        items: [
          "Equipo o instalación: split, vitrina, bomba de calor, cámara u otro.",
          "Comuna y tipo de inmueble o negocio.",
          "Síntoma, fecha de inicio y comportamiento intermitente o continuo.",
          "Código de error, ruido, olor o temperatura observada.",
          "Disponibilidad para una eventual visita.",
        ],
      },
      {
        title: "Una plantilla que puedes adaptar",
        paragraphs: [
          "“Necesito diagnóstico para [equipo] en [comuna]. Desde [momento] presenta [síntoma]. La marca/modelo es [dato] y muestra [código o lectura]. El espacio corresponde a [hogar/comercio/instalación]. Puedo coordinar visita en [horario]. Agradezco indicar alcance y condición de la visita.”",
        ],
      },
      {
        title: "Qué no debes enviar",
        paragraphs: [
          "No compartas contraseñas, documentos de identidad, medios de pago ni fotografías de terceros. La dirección exacta puede acordarse directamente cuando exista una coordinación válida.",
          "Si existe una condición eléctrica o mecánica peligrosa, prioriza la seguridad, detén el uso cuando puedas hacerlo sin riesgo y descríbela claramente.",
        ],
      },
    ],
  },
] as const;

export function getServiceLandingPage(slug: string): ServiceLandingPage | undefined {
  return serviceLandingPages.find((page) => page.slug === slug);
}

export function getOrganicGuide(slug: string): OrganicGuide | undefined {
  return organicGuides.find((guide) => guide.slug === slug);
}
