import "server-only";

import nodemailer from "nodemailer";
import type { ContactEmailContext } from "@/lib/contact-requests/repository";
import {
  administratorRegistrationEmailTemplate,
  applicantRegistrationEmailTemplate,
  customerContactEmailTemplate,
  professionalRequestEmailTemplate,
  professionalChangeAdministratorEmailTemplate,
  qualificationAdministratorEmailTemplate,
  qualificationApplicantEmailTemplate,
  qualificationDecisionEmailTemplate,
  identityAdministratorEmailTemplate,
  identityApplicantEmailTemplate,
  identityDecisionEmailTemplate,
  reviewInvitationEmailTemplate,
  smtpTestEmailTemplate,
} from "@/lib/email/templates";
import { qualificationTypeLabel, type ProfessionalQualificationType } from "@/domain/professional-qualification";
import { identityDocumentTypeLabel, type IdentityDocumentType } from "@/domain/identity-document";
import { publicSiteUrl } from "@/lib/site-url";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface MailDeliveryResult {
  configured: boolean;
  customer: "sent" | "failed" | "skipped";
  professional: "sent" | "failed" | "skipped";
}

export type SingleMailDeliveryResult = "sent" | "failed" | "skipped";

export interface ReviewInvitationContext {
  customerName: string;
  customerEmail: string;
  professionalName: string;
  service: string;
  trackingToken: string;
}

export interface ProfessionalRegistrationEmailContext {
  applicantName: string;
  applicantEmail: string;
  displayName: string;
  professionalKind: string;
  category: string;
  region: string;
  commune: string;
}

export interface ProfessionalRegistrationMailDeliveryResult {
  configured: boolean;
  administrator: "sent" | "failed" | "skipped";
  applicant: "sent" | "failed" | "skipped";
}

export interface ProfessionalChangeEmailContext {
  applicantName: string;
  applicantEmail: string | null;
  professionalName: string;
  professionalKind: string;
  section: string;
  adminUrl: string;
}

export interface QualificationSubmissionEmailContext {
  applicantEmail: string | null;
  applicantName: string;
  professionalName: string;
  qualificationTitle: string;
  qualificationType: ProfessionalQualificationType;
}

export interface QualificationDecisionEmailContext {
  applicantEmail: string;
  applicantName: string;
  qualificationTitle: string;
  decision: "approved" | "changes_requested" | "rejected";
  reason: string;
}

export interface IdentitySubmissionEmailContext {
  applicantEmail: string | null;
  applicantName: string;
  professionalName: string;
  documentType: IdentityDocumentType;
}

export interface IdentityDecisionEmailContext {
  applicantEmail: string;
  applicantName: string;
  decision: "approved" | "changes_requested" | "rejected";
  reason: string;
}

function administratorNotificationEmail(): string | null {
  const email = process.env.ADMIN_NOTIFICATION_EMAIL?.trim().toLowerCase();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : null;
}

function smtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !password || !fromEmail) return null;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user,
    password,
    fromEmail,
    fromName: process.env.SMTP_FROM_NAME?.trim() || "Red Técnicos Chile",
  };
}

export function smtpConfigurationStatus(): "configured" | "missing" {
  return smtpConfig() ? "configured" : "missing";
}

export function registrationNotificationStatus(): "configured" | "missing" {
  return smtpConfig() && administratorNotificationEmail() ? "configured" : "missing";
}

function transporter() {
  const config = smtpConfig();
  if (!config) throw new Error("SMTP_NOT_CONFIGURED");
  return {
    config,
    client: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.password },
      requireTLS: !config.secure,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    }),
  };
}

export async function verifySmtpConnection(): Promise<void> {
  const { client } = transporter();
  try {
    await client.verify();
  } finally {
    client.close();
  }
}

export async function sendSmtpTestEmail(recipient: string): Promise<void> {
  const { client, config } = transporter();
  const template = smtpTestEmailTemplate();
  try {
    await client.sendMail({
      from: { name: config.fromName, address: config.fromEmail },
      to: recipient,
      ...template,
    });
  } finally {
    client.close();
  }
}

export async function sendContactRequestEmails(context: ContactEmailContext): Promise<MailDeliveryResult> {
  const value = smtpConfig();
  if (!value) return { configured: false, customer: "skipped", professional: "skipped" };

  const { client, config } = transporter();
  const trackingUrl = publicSiteUrl(`/seguimiento/${encodeURIComponent(context.trackingToken)}`);
  const verificationUrl = publicSiteUrl(`/api/v1/contact-requests/verify/${encodeURIComponent(context.verificationToken)}?tracking=${encodeURIComponent(context.trackingToken)}`);
  const from = { name: config.fromName, address: config.fromEmail };
  const customerTemplate = customerContactEmailTemplate({
    customerName: context.customerName,
    professionalName: context.professionalName,
    professionalEmail: context.professionalEmail,
    professionalPhone: context.professionalPhone,
    service: context.service,
    commune: context.commune,
    verificationUrl,
    trackingUrl,
  });
  const professionalTemplate = professionalRequestEmailTemplate({
    customerName: context.customerName,
    customerEmail: context.customerEmail,
    customerPhone: context.customerPhone,
    service: context.service,
    commune: context.commune,
    description: context.description,
    panelUrl: publicSiteUrl("/panel/solicitudes"),
  });

  let customer: PromiseSettledResult<unknown>;
  let professional: PromiseSettledResult<unknown>;
  try {
    [customer, professional] = await Promise.allSettled([
      client.sendMail({ from, to: context.customerEmail, ...customerTemplate }),
      client.sendMail({ from, to: context.professionalEmail, replyTo: context.customerEmail, ...professionalTemplate }),
    ]);
  } finally {
    client.close();
  }

  return {
    configured: true,
    customer: customer.status === "fulfilled" ? "sent" : "failed",
    professional: professional.status === "fulfilled" ? "sent" : "failed",
  };
}

export async function sendProfessionalRegistrationEmails(
  context: ProfessionalRegistrationEmailContext,
): Promise<ProfessionalRegistrationMailDeliveryResult> {
  if (!smtpConfig()) return { configured: false, administrator: "skipped", applicant: "skipped" };

  const administratorEmail = administratorNotificationEmail();
  const { client, config } = transporter();
  const from = { name: config.fromName, address: config.fromEmail };
  const applicantTemplate = applicantRegistrationEmailTemplate({
    applicantName: context.applicantName,
    displayName: context.displayName,
    professionalKind: context.professionalKind,
    loginUrl: publicSiteUrl("/ingresar"),
  });
  const administratorTemplate = administratorEmail ? administratorRegistrationEmailTemplate({
    ...context,
    adminUrl: publicSiteUrl("/admin/postulaciones"),
  }) : null;

  const applicantPromise = client.sendMail({
    from,
    to: context.applicantEmail,
    ...applicantTemplate,
  });
  const administratorPromise = administratorEmail && administratorTemplate
    ? client.sendMail({
        from,
        to: administratorEmail,
        replyTo: context.applicantEmail,
        ...administratorTemplate,
      })
    : null;

  try {
    const [applicant, administrator] = await Promise.allSettled([
      applicantPromise,
      administratorPromise ?? Promise.resolve(null),
    ]);
    return {
      configured: true,
      applicant: applicant.status === "fulfilled" ? "sent" : "failed",
      administrator: administratorPromise
        ? administrator.status === "fulfilled" ? "sent" : "failed"
        : "skipped",
    };
  } finally {
    client.close();
  }
}

export async function sendProfessionalChangeNotificationEmail(
  context: ProfessionalChangeEmailContext,
): Promise<SingleMailDeliveryResult> {
  if (!smtpConfig()) return "skipped";
  const administratorEmail = administratorNotificationEmail();
  if (!administratorEmail) return "skipped";

  const { client, config } = transporter();
  try {
    await client.sendMail({
      from: { name: config.fromName, address: config.fromEmail },
      to: administratorEmail,
      ...(context.applicantEmail ? { replyTo: context.applicantEmail } : {}),
      ...professionalChangeAdministratorEmailTemplate(context),
    });
    return "sent";
  } catch {
    return "failed";
  } finally {
    client.close();
  }
}

export async function sendQualificationSubmissionEmails(
  context: QualificationSubmissionEmailContext,
): Promise<"sent" | "partial" | "failed" | "skipped"> {
  if (!smtpConfig()) return "skipped";
  const administratorEmail = administratorNotificationEmail();
  if (!administratorEmail && !context.applicantEmail) return "skipped";

  const { client, config } = transporter();
  const from = { name: config.fromName, address: config.fromEmail };
  const templateInput = {
    applicantName: context.applicantName,
    professionalName: context.professionalName,
    qualificationTitle: context.qualificationTitle,
    qualificationType: qualificationTypeLabel(context.qualificationType),
    panelUrl: publicSiteUrl("/panel/formacion"),
    adminUrl: publicSiteUrl("/admin/documentos"),
  };
  const deliveries: Array<Promise<unknown>> = [];
  if (context.applicantEmail) {
    deliveries.push(client.sendMail({
      from,
      to: context.applicantEmail,
      ...qualificationApplicantEmailTemplate(templateInput),
    }));
  }
  if (administratorEmail) {
    deliveries.push(client.sendMail({
      from,
      to: administratorEmail,
      ...(context.applicantEmail ? { replyTo: context.applicantEmail } : {}),
      ...qualificationAdministratorEmailTemplate(templateInput),
    }));
  }

  try {
    const results = await Promise.allSettled(deliveries);
    const sent = results.filter((result) => result.status === "fulfilled").length;
    if (sent === results.length) return "sent";
    return sent > 0 ? "partial" : "failed";
  } finally {
    client.close();
  }
}

export async function sendQualificationDecisionEmail(
  context: QualificationDecisionEmailContext,
): Promise<SingleMailDeliveryResult> {
  if (!smtpConfig()) return "skipped";
  const { client, config } = transporter();
  const template = qualificationDecisionEmailTemplate({
    ...context,
    panelUrl: publicSiteUrl("/panel/formacion"),
  });
  try {
    await client.sendMail({
      from: { name: config.fromName, address: config.fromEmail },
      to: context.applicantEmail,
      ...template,
    });
    return "sent";
  } catch {
    return "failed";
  } finally {
    client.close();
  }
}

export async function sendIdentitySubmissionEmails(context: IdentitySubmissionEmailContext): Promise<"sent" | "partial" | "failed" | "skipped"> {
  if (!smtpConfig()) return "skipped";
  const administratorEmail = administratorNotificationEmail();
  if (!administratorEmail && !context.applicantEmail) return "skipped";
  const { client, config } = transporter();
  const input = { applicantName: context.applicantName, professionalName: context.professionalName, documentType: identityDocumentTypeLabel(context.documentType), panelUrl: publicSiteUrl("/panel/identidad"), adminUrl: publicSiteUrl("/admin/documentos") };
  const deliveries: Array<Promise<unknown>> = [];
  if (context.applicantEmail) deliveries.push(client.sendMail({ from: { name: config.fromName, address: config.fromEmail }, to: context.applicantEmail, ...identityApplicantEmailTemplate(input) }));
  if (administratorEmail) deliveries.push(client.sendMail({ from: { name: config.fromName, address: config.fromEmail }, to: administratorEmail, ...(context.applicantEmail ? { replyTo: context.applicantEmail } : {}), ...identityAdministratorEmailTemplate(input) }));
  try { const results = await Promise.allSettled(deliveries); const sent = results.filter((result) => result.status === "fulfilled").length; return sent === results.length ? "sent" : sent ? "partial" : "failed"; } finally { client.close(); }
}

export async function sendIdentityDecisionEmail(context: IdentityDecisionEmailContext): Promise<SingleMailDeliveryResult> {
  if (!smtpConfig()) return "skipped";
  const { client, config } = transporter();
  try { await client.sendMail({ from: { name: config.fromName, address: config.fromEmail }, to: context.applicantEmail, ...identityDecisionEmailTemplate({ ...context, panelUrl: publicSiteUrl("/panel/identidad") }) }); return "sent"; } catch { return "failed"; } finally { client.close(); }
}

export async function sendReviewInvitationEmail(context: ReviewInvitationContext): Promise<SingleMailDeliveryResult> {
  if (!smtpConfig()) return "skipped";

  const { client, config } = transporter();
  const template = reviewInvitationEmailTemplate({
    customerName: context.customerName,
    professionalName: context.professionalName,
    service: context.service,
    trackingUrl: publicSiteUrl(`/seguimiento/${encodeURIComponent(context.trackingToken)}`),
  });

  try {
    await client.sendMail({
      from: { name: config.fromName, address: config.fromEmail },
      to: context.customerEmail,
      ...template,
    });
    return "sent";
  } catch {
    return "failed";
  } finally {
    client.close();
  }
}
