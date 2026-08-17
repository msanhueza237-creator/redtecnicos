export const supabaseAuthTemplateNames = [
  "confirmation",
  "recovery",
  "invite",
  "email-change",
] as const;

export type SupabaseAuthTemplateName = (typeof supabaseAuthTemplateNames)[number];

interface AuthTemplateContent {
  eyebrow: string;
  title: string;
  intro: string;
  actionLabel: string;
  notice: string;
  detailHtml?: string;
}

const confirmationUrl = "{{ .ConfirmationURL }}";
const verificationToken = "{{ .Token }}";

const contentByTemplate: Record<SupabaseAuthTemplateName, AuthTemplateContent> = {
  confirmation: {
    eyebrow: "Confirma tu registro",
    title: "Activa tu cuenta profesional",
    intro:
      "Confirma tu correo para continuar con la creación y revisión de tu perfil en Red Técnicos Chile.",
    actionLabel: "Confirmar mi cuenta",
    notice:
      "Si no solicitaste este registro, puedes ignorar el mensaje. Tu dirección no será publicada por esta acción.",
  },
  recovery: {
    eyebrow: "Recuperación segura",
    title: "Restablece tu contraseña",
    intro:
      "Recibimos una solicitud para crear una nueva contraseña de acceso a Red Técnicos Chile.",
    actionLabel: "Restablecer contraseña",
    notice:
      "Si no solicitaste el cambio, ignora este correo. Tu contraseña actual seguirá funcionando.",
  },
  invite: {
    eyebrow: "Invitación de acceso",
    title: "Te invitaron a Red Técnicos Chile",
    intro:
      "Acepta la invitación para configurar tu acceso y comenzar a utilizar las funciones asignadas a tu cuenta.",
    actionLabel: "Aceptar invitación",
    notice:
      "Esta invitación es personal. No compartas el enlace ni el código de verificación con otras personas.",
  },
  "email-change": {
    eyebrow: "Protección de tu cuenta",
    title: "Confirma tu nuevo correo",
    intro:
      "Solicitaste cambiar la dirección de correo asociada a tu cuenta de Red Técnicos Chile.",
    actionLabel: "Confirmar nuevo correo",
    detailHtml:
      '<p style="margin:0 0 20px;color:#50636e;font-size:14px;line-height:22px">Nuevo correo solicitado: <strong style="color:#24343d">{{ .NewEmail }}</strong></p>',
    notice:
      "Si no reconoces esta solicitud, no confirmes el cambio y comunícate con administración.",
  },
};

export const supabaseAuthTemplateSubjects: Record<SupabaseAuthTemplateName, string> = {
  confirmation: "Confirma tu cuenta | Red Técnicos Chile",
  recovery: "Restablece tu contraseña | Red Técnicos Chile",
  invite: "Invitación de acceso | Red Técnicos Chile",
  "email-change": "Confirma tu nuevo correo | Red Técnicos Chile",
};

export function isSupabaseAuthTemplateName(value: string): value is SupabaseAuthTemplateName {
  return supabaseAuthTemplateNames.some((templateName) => templateName === value);
}

export function supabaseAuthEmailTemplate(templateName: SupabaseAuthTemplateName): string {
  const content = contentByTemplate[templateName];

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${content.title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f7f9;color:#24343d;font-family:Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${content.intro}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3f7f9">
    <tr>
      <td align="center" style="padding:24px 12px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px">
          <tr>
            <td style="padding:0 4px 16px">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="44" height="44" align="center" style="width:44px;height:44px;border-radius:12px;background:#2980b9;color:#c8ff55;font-size:24px;font-weight:700">❄</td>
                  <td style="padding-left:12px">
                    <strong style="display:block;color:#1f5f8f;font-size:17px;line-height:22px">Red Técnicos Chile</strong>
                    <span style="color:#60737e;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Refrigeración y climatización</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="overflow:hidden;border:1px solid #d5e1e7;border-radius:18px;background:#ffffff;box-shadow:0 8px 28px rgba(31,95,143,.08)">
              <div style="height:6px;background:#c8ff55"></div>
              <div style="padding:34px 34px 28px">
                <p style="margin:0 0 10px;color:#1f5f8f;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${content.eyebrow}</p>
                <h1 style="margin:0 0 14px;color:#1f2933;font-size:28px;line-height:35px">${content.title}</h1>
                <p style="margin:0 0 24px;color:#50636e;font-size:16px;line-height:25px">${content.intro}</p>
                ${content.detailHtml ?? ""}
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px">
                  <tr>
                    <td style="border-radius:10px;background:#1f5f8f">
                      <a href="${confirmationUrl}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-size:15px;font-weight:700;line-height:20px;text-decoration:none">${content.actionLabel}</a>
                    </td>
                  </tr>
                </table>
                <div style="margin:0 0 20px;padding:14px 16px;border-left:4px solid #c8ff55;background:#f5fbe8;color:#465b31;font-size:13px;line-height:20px">${content.notice}</div>
                <div style="padding-top:16px;border-top:1px solid #e7eef2">
                  <p style="margin:0 0 8px;color:#6b7d87;font-size:11px;line-height:17px">Si el botón no funciona, copia este enlace en tu navegador:</p>
                  <p style="margin:0;color:#6b7d87;font-size:11px;line-height:17px;word-break:break-all"><a href="${confirmationUrl}" style="color:#1f5f8f">${confirmationUrl}</a></p>
                  {{ if .Token }}<p style="margin:14px 0 0;color:#6b7d87;font-size:11px;line-height:17px">Código alternativo: <strong style="color:#24343d;letter-spacing:.08em">${verificationToken}</strong></p>{{ end }}
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 14px 0;text-align:center;color:#70828c;font-size:11px;line-height:17px">
              Nunca solicitaremos tu contraseña, datos bancarios ni pagos mediante correo.<br>
              <a href="https://redtecnicos.cl/seguridad" style="color:#1f5f8f">Seguridad</a> · <a href="https://redtecnicos.cl/privacidad" style="color:#1f5f8f">Privacidad</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
