import "server-only";

import nodemailer from "nodemailer";
import type { ContactEmailContext } from "@/lib/contact-requests/repository";
import {
  administratorRegistrationEmailTemplate,
  applicantRegistrationEmailTemplate,
  customerContactEmailTemplate,
  professionalRequestEmailTemplate,
  reviewInvitationEmailTemplate,
  smtpTestEmailTemplate,
} from "@/lib/email/templates";
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
