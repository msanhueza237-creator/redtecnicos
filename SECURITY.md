# Seguridad

## Alcance y postura actual

La demo operativa continúa con fixtures ficticios. El repositorio ya contiene
Supabase Auth, RLS y scripts para una instancia self-hosted exclusiva de Red
Técnicos Chile. La instancia compartida observada anteriormente continúa fuera
de alcance y nunca debe reutilizarse.

No deben ejecutarse despliegues, migraciones, cambios DNS, cambios en Dokploy,
acciones sobre GitHub remoto ni llamadas a Supabase remoto sin autorización
expresa.

## Datos prohibidos en el repositorio y los logs

- Contraseñas, tokens de sesión, claves API y `SUPABASE_SERVICE_ROLE_KEY`.
- Archivos `.env` reales, backups o volcados de base de datos.
- RUT, identidad, certificados completos, domicilios particulares o datos
  bancarios.
- Documentos, fotografías o datos de terceros sin autorización.
- Cuerpos completos de correo, formularios, documentos privados o CAPTCHA.
- IP cruda y user-agent completo cuando no sean estrictamente necesarios.

Los fixtures deben ser reconocibles como ficticios y nunca reutilizar datos
plausibles de terceros.

## Modelo de amenazas prioritario

| Riesgo | Controles obligatorios |
| --- | --- |
| Lectura entre propietarios | Autorización del caso de uso, RLS y pruebas por rol |
| Publicación de datos privados | Proyección `directory_profiles`, allowlist de campos y revisión |
| Escalada de rol | Roles solo del servidor, RLS y auditoría |
| Carga maliciosa | Cuarentena, firma/MIME/tamaño, UUID, ClamAV y re-codificación |
| Spam y abuso público | Turnstile, rate limit PostgreSQL y respuesta no enumerable |
| Robo de token | Token opaco hasheado, expiración, uso limitado y cookies seguras |
| Inyección/XSS | Zod, consultas parametrizadas, escape por defecto y CSP |
| CSRF | Cookies `SameSite`, verificación de origen y token cuando corresponda |
| Filtración por logs | Redacción centralizada, metadatos mínimos y retención |
| Demo mezclada con producción | Exclusión SQL obligatoria y tests negativos |
| Pérdida o corrupción | Backups cifrados y restauración ensayada |

## Autenticación y sesiones

- El modo local dispone de una sesión demo HMAC exclusivamente para fixtures.
  La cookie es `HttpOnly`, `SameSite=Strict`, dura ocho horas y el rol se valida
  en layouts del servidor. `DEMO_AUTH_ENABLED=false` o cualquier origen distinto
  de `fixtures` la deshabilita.
- `AUTH_DATA_SOURCE=supabase` deshabilita la sesiÃ³n demo y activa cuentas y
  roles reales aunque `APP_DATA_SOURCE=fixtures` mantenga temporalmente los
  datos pÃºblicos de demostraciÃ³n. Esto no habilita persistencia de contactos.
- La sesión demo no representa una cuenta ni sustituye autenticación real. El
  modo Supabase ya integra Auth y RLS, pero los datos reales quedan bloqueados
  hasta configurar correo verificado y 2FA administrativa. En una compilación de fixtures fuera
  del desarrollo local se exige `DEMO_AUTH_SECRET` de al menos 32 bytes.
- La navegación pública nunca enlaza el acceso administrativo demo. Esto mejora
  su descubribilidad controlada durante la revisión, pero no es una medida de
  autorización. La guarda del servidor sigue siendo obligatoria y, con datos
  reales, el enlace **Administración** solo se renderizará después de resolver
  una sesión Supabase válida y su rol desde datos controlados por el servidor.
- Supabase Auth valida el JWT con `getClaims()` y resuelve el rol desde
  `app_users`; no confía en `raw_user_meta_data` para autorizar.
- El registro solo asigna `technician` o `company`. Los roles de personal se
  promueven mediante SQL privilegiado, con motivo y auditoría.
- Verificación de correo y recuperación deben responder sin enumerar cuentas.
- Cookies `Secure`, `HttpOnly` cuando aplique y `SameSite=Lax` o más estricto.
- Rotación/invalidez de sesión después de cambios sensibles.
- 2FA obligatorio para administradores antes de producción, aunque el brief lo
  considere opcional.
- Acciones administrativas de alto impacto requieren reautenticación y motivo.
- El navegador recibe solo la clave pública/anon del ambiente; la service role se
  limita a procesos de backend y secretos de Dokploy.

## Autorización y RLS

Cada operación valida actor, recurso, propiedad y estado. RLS debe activarse en
todas las tablas expuestas, incluso si la interfaz no las consulta directamente.
El técnico o empresa solo administra su propio agregado y nunca aprueba sus
documentos, publica directamente, cambia puntajes o asigna roles.

Moderador, admin y superadmin tienen permisos separados. Los permisos de
moderación se limitan al módulo asignado; modificar seguridad, integraciones o
administradores es exclusivo de superadmin.

El prototipo expone al revisor un único perfil **Administrador**, autorizado para
las doce secciones del centro de control. Los tipos `moderator` y `superadmin`
se conservan en el dominio para la política futura, pero no aparecen como
selectores públicos de la demo. En producción sus permisos deberán definirse y
probarse con Supabase/RLS antes de habilitarlos.

## Entrada, API y navegador

- Validar cuerpo, parámetros y variables de entorno con Zod y límites explícitos.
- Sanitizar rich text; para textos normales almacenar texto plano.
- Aplicar tamaño máximo de petición y paginación limitada.
- Usar mensajes genéricos hacia el cliente y registrar un ID de correlación, no
  la excepción interna.
- Añadir CSP, HSTS en HTTPS, `X-Content-Type-Options: nosniff`, política de
  referrer y permisos restrictiva.
- Limitar CORS al origen de cada ambiente; no usar comodín con credenciales.
- Verificar Turnstile en servidor antes de procesar registro, contacto, reporte o
  recuperación expuestos al abuso.

## Archivos

Todo archivo entra en `private-quarantine`. Se comprueba firma mágica, MIME
detectado, extensión permitida, tamaño y límites de imagen/PDF. Se asigna un
nombre UUID y nunca se publica el nombre original como ruta. Las imágenes se
decodifican y re-codifican para eliminar EXIF; los documentos pasan por ClamAV.

En producción el procesamiento debe fallar cerrado: si ClamAV no está disponible,
el archivo permanece en cuarentena y no puede ser revisado como seguro. Las URLs
firmadas de buckets privados son breves, específicas y auditables.

## Privacidad y consentimiento

- Recoger solo datos necesarios y marcar de forma explícita qué campos serán
  públicos.
- Los canales del profesional se mantienen fuera de la proyección pública y se
  entregan solo después de validar una solicitud y su consentimiento. El
  historial administrativo es privado y nunca muestra el token ni su hash.
- La implementación actual de contacto falla cerrada fuera de `fixtures`. Antes
  de habilitar datos reales requiere Supabase/RLS, Turnstile, rate limiting,
  correo operacional y revisión jurídica del consentimiento y la retención.
- Versionar términos, privacidad, autorización de publicación y aviso de
  responsabilidad; guardar fecha, versión, actor/sesión y evidencia minimizada.
- Hashear IP con HMAC rotativo; no confundir hash con anonimización irreversible.
- En visitas a perfiles, la HMAC rotativa se usa solo para rate limiting; la
  analítica persistente contiene exclusivamente totales diarios por perfil y
  se elimina después de 13 meses.
- Separar correos operativos, de seguridad y comerciales. Marketing exige un
  consentimiento independiente y revocable.
- Las retenciones de 90 días, 13 meses, 24 meses y 5 años son provisionales hasta
  revisión jurídica chilena.

## Auditoría

Registrar inicio/cierre de sesión administrativo, cambios de rol, decisiones de
moderación, suspensión/reactivación, acceso excepcional a documentos, corrección
de puntuación, cambios de configuración y exportaciones. Cada entrada conserva
actor, acción, recurso, fecha, motivo y diferencias minimizadas. No guardar el
documento ni el secreto afectado.

## Gestión de vulnerabilidades

No publicar vulnerabilidades ni datos de usuarios en issues. Reportar de forma
privada al responsable designado por Red Técnicos Chile, incluyendo impacto, pasos de
reproducción seguros y versión afectada. Hasta definir el canal definitivo, el
equipo debe escalar internamente y evitar crear un issue público.

## Barreras antes de staging

- Instancia Supabase dedicada y vacía, RLS probado por rol y buckets privados.
- Secretos independientes, Turnstile, correo de prueba y ClamAV operativo.
- Dependencias auditadas, lint, tipos, unitarias, build y Playwright aprobados.
- Backup cifrado y restauración ensayada.
- Logs revisados para confirmar ausencia de PII y secretos.

## Barreras antes de producción

Además de staging: revisión jurídica chilena, autorización expresa, HTTPS,
dominios confirmados, 2FA administrativa, rotación de secretos, SMTP/Resend y
ClamAV disponibles, plan de rollback probado, retención aprobada, monitoreo y
responsables de incidentes definidos. Si falta una barrera, no se despliega.
