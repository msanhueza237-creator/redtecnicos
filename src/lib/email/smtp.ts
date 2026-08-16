import "server-only";

import nodemailer from "nodemailer";
import type { ContactEmailContext } from "@/lib/contact-requests/repository";

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

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/gu, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[character] ?? character);
}

function siteUrl(): string {
  return (process.env.APP_URL?.trim() || "https://redtecnicos.cl").replace(/\/$/u, "");
}

export async function verifySmtpConnection(): Promise<void> {
  const { client } = transporter();
  await client.verify();
  client.close();
}

export async function sendSmtpTestEmail(recipient: string): Promise<void> {
  const { client, config } = transporter();
  await client.sendMail({
    from: { name: config.fromName, address: config.fromEmail },
    to: recipient,
    subject: "Prueba SMTP · Red Técnicos Chile",
    text: "La conexión SMTP de Red Técnicos Chile fue validada correctamente.",
    html: "<h1>Conexión SMTP validada</h1><p>Red Técnicos Chile puede enviar correos transaccionales desde la aplicación.</p>",
  });
  client.close();
}

export async function sendContactRequestEmails(context: ContactEmailContext): Promise<MailDeliveryResult> {
  const value = smtpConfig();
  if (!value) return { configured: false, customer: "skipped", professional: "skipped" };

  const { client, config } = transporter();
  const trackingUrl = `${siteUrl()}/seguimiento/${encodeURIComponent(context.trackingToken)}`;
  const verificationUrl = `${siteUrl()}/api/v1/contact-requests/verify/${encodeURIComponent(context.verificationToken)}?tracking=${encodeURIComponent(context.trackingToken)}`;
  const from = { name: config.fromName, address: config.fromEmail };

  const [customer, professional] = await Promise.allSettled([
    client.sendMail({
      from,
      to: context.customerEmail,
      subject: `Confirma tu solicitud a ${context.professionalName}`,
      text: `Hola ${context.customerName},\n\nRegistramos tu solicitud de ${context.service} en ${context.commune}.\n\nConfirma tu correo: ${verificationUrl}\nSeguimiento privado: ${trackingUrl}\n\nContacto del profesional:\n${context.professionalName}\n${context.professionalEmail}\n${context.professionalPhone}\n\nRed Técnicos Chile no interviene en presupuestos, pagos ni ejecución del servicio.`,
      html: `<h1>Solicitud registrada</h1><p>Hola ${escapeHtml(context.customerName)}, registramos tu solicitud de <strong>${escapeHtml(context.service)}</strong> en ${escapeHtml(context.commune)}.</p><p><a href="${verificationUrl}">Confirmar correo y abrir seguimiento</a></p><h2>Contacto del profesional</h2><p><strong>${escapeHtml(context.professionalName)}</strong><br>${escapeHtml(context.professionalEmail)}<br>${escapeHtml(context.professionalPhone)}</p><p><a href="${trackingUrl}">Abrir seguimiento privado</a></p><p><small>Red Técnicos Chile no interviene en presupuestos, pagos ni ejecución del servicio.</small></p>`,
    }),
    client.sendMail({
      from,
      to: context.professionalEmail,
      replyTo: context.customerEmail,
      subject: `Nueva solicitud: ${context.service} en ${context.commune}`,
      text: `Nueva solicitud en Red Técnicos Chile\n\nCliente: ${context.customerName}\nCorreo: ${context.customerEmail}\nCelular: ${context.customerPhone ?? "No informado"}\nComuna: ${context.commune}\nServicio: ${context.service}\nDescripción: ${context.description}\n\nGestiona el historial en ${siteUrl()}/panel/solicitudes`,
      html: `<h1>Nueva solicitud de contacto</h1><p><strong>Cliente:</strong> ${escapeHtml(context.customerName)}<br><strong>Correo:</strong> ${escapeHtml(context.customerEmail)}<br><strong>Celular:</strong> ${escapeHtml(context.customerPhone ?? "No informado")}<br><strong>Comuna:</strong> ${escapeHtml(context.commune)}<br><strong>Servicio:</strong> ${escapeHtml(context.service)}</p><p><strong>Descripción:</strong><br>${escapeHtml(context.description)}</p><p><a href="${siteUrl()}/panel/solicitudes">Abrir historial profesional</a></p>`,
    }),
  ]);
  client.close();

  return {
    configured: true,
    customer: customer.status === "fulfilled" ? "sent" : "failed",
    professional: professional.status === "fulfilled" ? "sent" : "failed",
  };
}
