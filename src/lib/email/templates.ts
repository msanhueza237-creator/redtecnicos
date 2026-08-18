export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

interface EmailAction {
  label: string;
  url: string;
}

interface EmailLayoutInput {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  bodyHtml: string;
  action?: EmailAction;
  secondaryAction?: EmailAction;
  footnote?: string;
}

export function escapeEmailHtml(value: string): string {
  return value.replace(/[&<>'"]/gu, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[character] ?? character);
}

function paragraph(value: string): string {
  return escapeEmailHtml(value).replace(/\r?\n/gu, "<br>");
}

function actionButton(action: EmailAction, secondary = false): string {
  const background = secondary ? "#eef5f9" : "#1f5f8f";
  const color = secondary ? "#1f5f8f" : "#ffffff";
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px"><tr><td style="border-radius:10px;background:${background}"><a href="${escapeEmailHtml(action.url)}" style="display:inline-block;padding:13px 20px;color:${color};font-family:Arial,sans-serif;font-size:15px;font-weight:700;line-height:20px;text-decoration:none">${escapeEmailHtml(action.label)}</a></td></tr></table>`;
}

function emailLayout(input: EmailLayoutInput): string {
  const actionHtml = input.action ? actionButton(input.action) : "";
  const secondaryActionHtml = input.secondaryAction ? actionButton(input.secondaryAction, true) : "";
  const fallbackLinks = [input.action, input.secondaryAction]
    .filter((action): action is EmailAction => Boolean(action))
    .map((action) => `<p style="margin:8px 0 0;color:#6b7d87;font-size:11px;line-height:17px;word-break:break-all"><strong>${escapeEmailHtml(action.label)}:</strong><br><a href="${escapeEmailHtml(action.url)}" style="color:#1f5f8f">${escapeEmailHtml(action.url)}</a></p>`)
    .join("");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeEmailHtml(input.title)}</title></head>
<body style="margin:0;padding:0;background:#f3f7f9;color:#24343d;font-family:Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeEmailHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f7f9"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px">
      <tr><td style="padding:0 4px 16px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="44" height="44" align="center" style="border-radius:12px;background:#2980b9;color:#c8ff55;font-size:24px;font-weight:700">❄</td><td style="padding-left:12px"><strong style="display:block;color:#1f5f8f;font-size:17px;line-height:22px">Red Técnicos Chile</strong><span style="color:#60737e;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Refrigeración y climatización</span></td></tr></table></td></tr>
      <tr><td style="overflow:hidden;border:1px solid #d5e1e7;border-radius:18px;background:#ffffff;box-shadow:0 8px 28px rgba(31,95,143,.08)">
        <div style="height:6px;background:#c8ff55"></div>
        <div style="padding:34px 34px 28px">
          <p style="margin:0 0 10px;color:#1f5f8f;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${escapeEmailHtml(input.eyebrow)}</p>
          <h1 style="margin:0 0 14px;color:#1f2933;font-size:28px;line-height:35px">${escapeEmailHtml(input.title)}</h1>
          <p style="margin:0 0 24px;color:#50636e;font-size:16px;line-height:25px">${escapeEmailHtml(input.intro)}</p>
          ${input.bodyHtml}
          <div style="margin-top:26px">${actionHtml}${secondaryActionHtml}</div>
          ${fallbackLinks ? `<div style="margin-top:18px;padding-top:16px;border-top:1px solid #e7eef2"><p style="margin:0 0 6px;color:#6b7d87;font-size:11px;line-height:17px">Si un botón no funciona, copia el enlace en tu navegador:</p>${fallbackLinks}</div>` : ""}
        </div>
      </td></tr>
      <tr><td style="padding:18px 14px 0;text-align:center;color:#70828c;font-size:11px;line-height:17px">${escapeEmailHtml(input.footnote ?? "Red Técnicos Chile facilita el contacto directo. No interviene en presupuestos, pagos ni ejecución de servicios.")}<br><a href="https://redtecnicos.cl/seguridad" style="color:#1f5f8f">Seguridad</a> · <a href="https://redtecnicos.cl/privacidad" style="color:#1f5f8f">Privacidad</a></td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function detailsTable(rows: ReadonlyArray<{ label: string; value: string }>): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #dbe6eb;border-radius:12px;background:#f8fbfc">${rows.map((row, index) => `<tr><td style="padding:${index === 0 ? "16px" : "10px 16px"} ${index === rows.length - 1 ? "16px" : "10px"};${index < rows.length - 1 ? "border-bottom:1px solid #e4ecef;" : ""}color:#60737e;font-size:12px;line-height:18px;vertical-align:top;width:34%">${escapeEmailHtml(row.label)}</td><td style="padding:${index === 0 ? "16px" : "10px 16px"} ${index === rows.length - 1 ? "16px" : "10px"};${index < rows.length - 1 ? "border-bottom:1px solid #e4ecef;" : ""}color:#24343d;font-size:14px;font-weight:700;line-height:20px;vertical-align:top">${paragraph(row.value)}</td></tr>`).join("")}</table>`;
}

export function smtpTestEmailTemplate(): EmailTemplate {
  return {
    subject: "Conexión SMTP validada · Red Técnicos Chile",
    text: "La conexión SMTP de Red Técnicos Chile fue validada correctamente. La plataforma puede enviar correos transaccionales.",
    html: emailLayout({
      preheader: "La plataforma ya puede enviar correos transaccionales.",
      eyebrow: "Prueba administrativa",
      title: "Conexión SMTP validada",
      intro: "La plataforma puede enviar correos transaccionales desde notificaciones@redtecnicos.cl.",
      bodyHtml: detailsTable([
        { label: "Estado", value: "Operativo" },
        { label: "Canal", value: "SMTP cifrado" },
        { label: "Uso", value: "Solicitudes, seguimiento y evaluaciones" },
      ]),
      action: { label: "Abrir administración", url: "https://redtecnicos.cl/admin/configuracion" },
      footnote: "Este mensaje fue generado por una prueba administrativa de Red Técnicos Chile.",
    }),
  };
}

export interface CustomerContactEmailInput {
  customerName: string;
  professionalName: string;
  professionalEmail: string;
  professionalPhone: string;
  service: string;
  commune: string;
  verificationUrl: string;
  trackingUrl: string;
}

export function customerContactEmailTemplate(input: CustomerContactEmailInput): EmailTemplate {
  return {
    subject: `Contacto de ${input.professionalName} · confirma tu solicitud`,
    text: `Hola ${input.customerName},\n\nRegistramos tu solicitud de ${input.service} en ${input.commune}.\n\nConfirma tu correo: ${input.verificationUrl}\nSeguimiento privado: ${input.trackingUrl}\n\nContacto del profesional:\n${input.professionalName}\n${input.professionalEmail}\n${input.professionalPhone}\n\nRed Técnicos Chile no interviene en presupuestos, pagos ni ejecución del servicio.`,
    html: emailLayout({
      preheader: `Recibimos tu solicitud y ya puedes contactar a ${input.professionalName}.`,
      eyebrow: "Solicitud registrada",
      title: "Ya tienes los datos del profesional",
      intro: `Hola ${input.customerName}. Registramos tu solicitud y guardamos un seguimiento privado para ti.`,
      bodyHtml: `${detailsTable([
        { label: "Profesional", value: input.professionalName },
        { label: "Correo", value: input.professionalEmail },
        { label: "Celular", value: input.professionalPhone },
        { label: "Servicio", value: input.service },
        { label: "Comuna", value: input.commune },
      ])}<p style="margin:18px 0 0;padding:14px 16px;border-left:4px solid #c8ff55;background:#f5fbe8;color:#465b31;font-size:13px;line-height:20px">Confirma tu correo para proteger el seguimiento y poder evaluar el trabajo cuando finalice.</p>`,
      action: { label: "Confirmar correo", url: input.verificationUrl },
      secondaryAction: { label: "Ver seguimiento", url: input.trackingUrl },
    }),
  };
}

export interface ProfessionalRequestEmailInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  service: string;
  commune: string;
  description: string;
  panelUrl: string;
}

export function professionalRequestEmailTemplate(input: ProfessionalRequestEmailInput): EmailTemplate {
  return {
    subject: `Nueva solicitud · ${input.service} en ${input.commune}`,
    text: `Nueva solicitud en Red Técnicos Chile\n\nCliente: ${input.customerName}\nCorreo: ${input.customerEmail}\nCelular: ${input.customerPhone ?? "No informado"}\nComuna: ${input.commune}\nServicio: ${input.service}\nDescripción: ${input.description}\n\nGestiona tu historial en ${input.panelUrl}`,
    html: emailLayout({
      preheader: `${input.customerName} solicitó ${input.service} en ${input.commune}.`,
      eyebrow: "Nueva oportunidad",
      title: "Recibiste una solicitud de contacto",
      intro: "El cliente registró sus datos antes de acceder a tu información de contacto.",
      bodyHtml: `${detailsTable([
        { label: "Cliente", value: input.customerName },
        { label: "Correo", value: input.customerEmail },
        { label: "Celular", value: input.customerPhone ?? "No informado" },
        { label: "Servicio", value: input.service },
        { label: "Comuna", value: input.commune },
      ])}<div style="margin-top:18px;padding:16px;border:1px solid #dbe6eb;border-radius:12px"><strong style="display:block;margin-bottom:7px;color:#1f2933;font-size:13px">Descripción del cliente</strong><p style="margin:0;color:#50636e;font-size:14px;line-height:22px">${paragraph(input.description)}</p></div>`,
      action: { label: "Gestionar solicitud", url: input.panelUrl },
      footnote: "Responde directamente al cliente y registra el avance desde tu panel profesional.",
    }),
  };
}

export interface AdministratorRegistrationEmailInput {
  applicantName: string;
  applicantEmail: string;
  displayName: string;
  professionalKind: string;
  category: string;
  region: string;
  commune: string;
  adminUrl: string;
}

export function administratorRegistrationEmailTemplate(input: AdministratorRegistrationEmailInput): EmailTemplate {
  return {
    subject: `Nueva postulación · ${input.displayName}`,
    text: `Nueva postulación en Red Técnicos Chile\n\nNombre visible: ${input.displayName}\nResponsable: ${input.applicantName}\nCorreo: ${input.applicantEmail}\nTipo: ${input.professionalKind}\nCategoría: ${input.category}\nUbicación: ${input.commune}, ${input.region}\nEstado: En revisión\n\nRevisar en administración: ${input.adminUrl}`,
    html: emailLayout({
      preheader: `${input.displayName} envió una nueva postulación.`,
      eyebrow: "Nueva postulación",
      title: "Hay un nuevo perfil por revisar",
      intro: "Se completó el registro inicial y la postulación ya está disponible en la bandeja administrativa.",
      bodyHtml: `${detailsTable([
        { label: "Nombre visible", value: input.displayName },
        { label: "Responsable", value: input.applicantName },
        { label: "Correo", value: input.applicantEmail },
        { label: "Tipo", value: input.professionalKind },
        { label: "Categoría", value: input.category },
        { label: "Ubicación", value: `${input.commune}, ${input.region}` },
        { label: "Estado", value: "En revisión" },
      ])}<p style="margin:18px 0 0;color:#50636e;font-size:13px;line-height:20px">Los documentos, antecedentes privados y decisiones de moderación solo se consultan dentro de la administración autenticada.</p>`,
      action: { label: "Revisar postulación", url: input.adminUrl },
      footnote: "Aviso administrativo generado automáticamente por Red Técnicos Chile.",
    }),
  };
}

export interface ApplicantRegistrationEmailInput {
  applicantName: string;
  displayName: string;
  professionalKind: string;
  loginUrl: string;
}

export function applicantRegistrationEmailTemplate(input: ApplicantRegistrationEmailInput): EmailTemplate {
  return {
    subject: "Recibimos tu postulación · Red Técnicos Chile",
    text: `Hola ${input.applicantName},\n\nRecibimos la postulación de ${input.displayName} como ${input.professionalKind}. Su estado inicial es En revisión.\n\nTambién recibirás un correo separado para confirmar tu dirección. Después de confirmarla podrás ingresar a tu panel: ${input.loginUrl}\n\nTu perfil no se publicará hasta completar la revisión administrativa.`,
    html: emailLayout({
      preheader: "Tu perfil fue recibido y quedó en revisión administrativa.",
      eyebrow: "Postulación recibida",
      title: "Tu perfil quedó en revisión",
      intro: `Hola ${input.applicantName}. Recibimos correctamente la información inicial de ${input.displayName}.`,
      bodyHtml: `${detailsTable([
        { label: "Tipo de perfil", value: input.professionalKind },
        { label: "Estado", value: "En revisión" },
        { label: "Siguiente paso", value: "Confirmar tu correo electrónico" },
      ])}<div style="margin-top:18px;padding:16px;border-left:4px solid #c8ff55;background:#f5fbe8;color:#465b31;font-size:13px;line-height:20px"><strong style="display:block;margin-bottom:5px">¿Qué ocurrirá ahora?</strong>Recibirás un correo separado para confirmar tu dirección. La administración revisará la postulación y el perfil no será público hasta su aprobación.</div>`,
      action: { label: "Ir al ingreso profesional", url: input.loginUrl },
      footnote: "Nunca solicitaremos pagos ni documentos respondiendo directamente a este correo.",
    }),
  };
}

export interface QualificationSubmissionEmailInput {
  applicantName: string;
  professionalName: string;
  qualificationTitle: string;
  qualificationType: string;
  panelUrl: string;
  adminUrl: string;
}

export function qualificationApplicantEmailTemplate(input: QualificationSubmissionEmailInput): EmailTemplate {
  return {
    subject: `Documento recibido · ${input.qualificationTitle}`,
    text: `Hola ${input.applicantName},\n\nRecibimos el respaldo de ${input.qualificationTitle}. El archivo superó el análisis de seguridad y quedó pendiente de revisión administrativa.\n\nPuedes revisar su estado en ${input.panelUrl}\n\nEl archivo completo permanecerá privado.`,
    html: emailLayout({
      preheader: `Recibimos el respaldo de ${input.qualificationTitle}.`,
      eyebrow: "Documento recibido",
      title: "Tu antecedente quedó en revisión",
      intro: `Hola ${input.applicantName}. El archivo fue recibido y superó el control automático de seguridad.`,
      bodyHtml: `${detailsTable([
        { label: "Perfil", value: input.professionalName },
        { label: "Tipo", value: input.qualificationType },
        { label: "Antecedente", value: input.qualificationTitle },
        { label: "Estado", value: "Pendiente de revisión administrativa" },
      ])}<p style="margin:18px 0 0;color:#50636e;font-size:13px;line-height:20px">El documento completo es privado. Si se aprueba, el perfil público mostrará únicamente el nombre de la formación, la institución y el año.</p>`,
      action: { label: "Revisar mis documentos", url: input.panelUrl },
      footnote: "Nunca solicitaremos que envíes documentos respondiendo directamente a este correo.",
    }),
  };
}

export function qualificationAdministratorEmailTemplate(input: QualificationSubmissionEmailInput): EmailTemplate {
  return {
    subject: `Nuevo documento por revisar · ${input.professionalName}`,
    text: `Nuevo documento en Red Técnicos Chile\n\nPerfil: ${input.professionalName}\nTipo: ${input.qualificationType}\nAntecedente: ${input.qualificationTitle}\nControl antivirus: Superado\nEstado: Pendiente de revisión\n\nRevisar en ${input.adminUrl}`,
    html: emailLayout({
      preheader: `${input.professionalName} cargó un documento privado.`,
      eyebrow: "Revisión documental",
      title: "Hay un nuevo antecedente por revisar",
      intro: "El archivo superó el control automático y está disponible únicamente para personal autorizado.",
      bodyHtml: detailsTable([
        { label: "Perfil", value: input.professionalName },
        { label: "Tipo", value: input.qualificationType },
        { label: "Antecedente", value: input.qualificationTitle },
        { label: "Seguridad", value: "Análisis antivirus superado" },
        { label: "Estado", value: "Pendiente de revisión" },
      ]),
      action: { label: "Abrir bandeja documental", url: input.adminUrl },
      footnote: "El enlace administrativo exige una sesión autorizada y el documento no se adjunta al correo.",
    }),
  };
}

export interface QualificationDecisionEmailInput {
  applicantName: string;
  qualificationTitle: string;
  decision: "approved" | "changes_requested" | "rejected";
  reason: string;
  panelUrl: string;
}

export function qualificationDecisionEmailTemplate(input: QualificationDecisionEmailInput): EmailTemplate {
  const decisionCopy = {
    approved: { subject: "Antecedente aprobado", state: "Aprobado", intro: "El antecedente fue revisado y aprobado." },
    changes_requested: { subject: "Se requieren cambios", state: "Cambios solicitados", intro: "La revisión requiere que reemplaces o corrijas el antecedente." },
    rejected: { subject: "Antecedente rechazado", state: "Rechazado", intro: "El antecedente no fue aprobado en esta revisión." },
  }[input.decision];

  return {
    subject: `${decisionCopy.subject} · ${input.qualificationTitle}`,
    text: `Hola ${input.applicantName},\n\n${decisionCopy.intro}\n\nAntecedente: ${input.qualificationTitle}\nEstado: ${decisionCopy.state}\nMotivo: ${input.reason}\n\nRevisa tu panel: ${input.panelUrl}`,
    html: emailLayout({
      preheader: `${input.qualificationTitle}: ${decisionCopy.state}.`,
      eyebrow: "Resultado de revisión",
      title: decisionCopy.subject,
      intro: `Hola ${input.applicantName}. ${decisionCopy.intro}`,
      bodyHtml: `${detailsTable([
        { label: "Antecedente", value: input.qualificationTitle },
        { label: "Estado", value: decisionCopy.state },
        { label: "Motivo", value: input.reason },
      ])}<p style="margin:18px 0 0;color:#50636e;font-size:13px;line-height:20px">Solo las credenciales aprobadas pueden aparecer en el perfil público. El archivo completo permanece privado.</p>`,
      action: { label: "Abrir formación y documentos", url: input.panelUrl },
      footnote: "Si se solicitaron cambios, retira el antecedente observado y carga un respaldo corregido desde tu panel.",
    }),
  };
}

export interface IdentitySubmissionEmailInput {
  applicantName: string;
  professionalName: string;
  documentType: string;
  panelUrl: string;
  adminUrl: string;
}

export function identityApplicantEmailTemplate(input: IdentitySubmissionEmailInput): EmailTemplate {
  return {
    subject: "Documento de identidad recibido · Red Técnicos Chile",
    text: `Hola ${input.applicantName},\n\nRecibimos tu ${input.documentType}. El archivo superó el análisis de seguridad y quedó pendiente de revisión administrativa.\n\nRevisa su estado: ${input.panelUrl}\n\nEl documento completo permanecerá privado.`,
    html: emailLayout({ preheader: "Tu documento privado quedó en revisión.", eyebrow: "Verificación de identidad", title: "Documento recibido", intro: `Hola ${input.applicantName}. El archivo superó el control automático de seguridad.`, bodyHtml: `${detailsTable([{ label: "Perfil", value: input.professionalName }, { label: "Tipo", value: input.documentType }, { label: "Estado", value: "Pendiente de revisión" }])}<p style="margin:18px 0 0;color:#50636e;font-size:13px;line-height:20px">El archivo nunca será público. Si se aprueba, el perfil mostrará únicamente la insignia “Identidad revisada”.</p>`, action: { label: "Revisar verificación", url: input.panelUrl }, footnote: "Nunca solicitaremos documentos respondiendo directamente a este correo." }),
  };
}

export function identityAdministratorEmailTemplate(input: IdentitySubmissionEmailInput): EmailTemplate {
  return {
    subject: `Nueva identidad por revisar · ${input.professionalName}`,
    text: `Nuevo documento privado\n\nPerfil: ${input.professionalName}\nTipo: ${input.documentType}\nAntivirus: Superado\nEstado: Pendiente\n\nRevisar: ${input.adminUrl}`,
    html: emailLayout({ preheader: `${input.professionalName} envió un documento privado.`, eyebrow: "Verificación de identidad", title: "Nueva verificación por revisar", intro: "El archivo superó el control automático y solo está disponible para personal autorizado.", bodyHtml: detailsTable([{ label: "Perfil", value: input.professionalName }, { label: "Tipo", value: input.documentType }, { label: "Seguridad", value: "Análisis antivirus superado" }, { label: "Estado", value: "Pendiente de revisión" }]), action: { label: "Abrir bandeja documental", url: input.adminUrl }, footnote: "El documento no se adjunta al correo y el enlace exige una sesión administrativa." }),
  };
}

export function identityDecisionEmailTemplate(input: { applicantName: string; decision: "approved" | "changes_requested" | "rejected"; reason: string; panelUrl: string }): EmailTemplate {
  const copy = {
    approved: { subject: "Identidad aprobada", state: "Aprobada" },
    changes_requested: { subject: "Se requieren cambios en tu identidad", state: "Cambios solicitados" },
    rejected: { subject: "Identidad no aprobada", state: "Rechazada" },
  }[input.decision];
  return { subject: copy.subject, text: `Hola ${input.applicantName},\n\nEstado: ${copy.state}\nMotivo: ${input.reason}\n\nRevisa tu panel: ${input.panelUrl}`, html: emailLayout({ preheader: `Resultado: ${copy.state}.`, eyebrow: "Resultado de verificación", title: copy.subject, intro: `Hola ${input.applicantName}. La administración terminó la revisión.`, bodyHtml: detailsTable([{ label: "Estado", value: copy.state }, { label: "Motivo", value: input.reason }]), action: { label: "Abrir identidad", url: input.panelUrl }, footnote: "El archivo completo permanece privado." }) };
}

export interface ReviewInvitationEmailInput {
  customerName: string;
  professionalName: string;
  service: string;
  trackingUrl: string;
}

export function reviewInvitationEmailTemplate(input: ReviewInvitationEmailInput): EmailTemplate {
  return {
    subject: `¿Cómo fue el trabajo de ${input.professionalName}?`,
    text: `Hola ${input.customerName},\n\nLa solicitud de ${input.service} fue marcada como completada. Tu experiencia puede ayudar a otros clientes.\n\nCalifica el servicio: ${input.trackingUrl}\n\nSolo se admite una evaluación por solicitud completada y con correo verificado.`,
    html: emailLayout({
      preheader: `Evalúa el trabajo realizado por ${input.professionalName}.`,
      eyebrow: "Solicitud completada",
      title: "Tu experiencia ayuda a otros clientes",
      intro: `Hola ${input.customerName}. El trabajo asociado a tu solicitud fue marcado como completado.`,
      bodyHtml: `${detailsTable([
        { label: "Profesional", value: input.professionalName },
        { label: "Servicio", value: input.service },
      ])}<p style="margin:18px 0 0;color:#50636e;font-size:14px;line-height:22px">La evaluación se revisará antes de publicarse. Solo puedes enviar una opinión vinculada a esta solicitud.</p>`,
      action: { label: "Calificar el servicio", url: input.trackingUrl },
      footnote: "Nunca solicitaremos datos bancarios ni pagos mediante este correo.",
    }),
  };
}
