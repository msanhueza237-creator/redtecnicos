"use server";

import { requireAppRole } from "@/lib/auth/session";
import { sendSmtpTestEmail, verifySmtpConnection } from "@/lib/email/smtp";

export interface SmtpTestState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function testSmtpAction(state: SmtpTestState): Promise<SmtpTestState> {
  void state;
  const session = await requireAppRole(["admin", "superadmin"], "/admin/configuracion");
  if (!session.email) return { status: "error", message: "La sesión administrativa no contiene un correo de destino." };

  try {
    await verifySmtpConnection();
    await sendSmtpTestEmail(session.email);
    return { status: "success", message: "Conexión validada y correo de prueba enviado al administrador autenticado." };
  } catch {
    return { status: "error", message: "No fue posible conectar o enviar. Revisa las variables SMTP y los registros del proveedor." };
  }
}
