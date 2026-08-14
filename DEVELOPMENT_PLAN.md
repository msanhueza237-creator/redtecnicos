# Plan de desarrollo

## Método de trabajo

Cada ciclo sigue ocho pasos: analizar, planificar, implementar una unidad
coherente, probar, revisar seguridad, documentar, informar y detenerse. Al final
se espera una nueva instrucción. Nunca se ejecutan `git push`, merge, despliegue,
migración de producción, DNS, Dokploy o Supabase remoto sin autorización expresa.

## Ciclo 1 — Fundación y experiencia local

**Objetivo:** entregar una aplicación navegable y profesional sin dependencias
remotas.

Entregables:

- Next.js, React, TypeScript estricto, Tailwind y salida `standalone`.
- Sistema visual Red Técnicos Chile accesible y responsive.
- Landing, directorio y perfil sobre un repositorio de fixtures.
- 10 perfiles inequívocamente ficticios y etiquetados como demo.
- Contratos Zod y esqueleto de Route Handlers sin secretos.
- Panel profesional y módulo administrativo navegables con una sesión local
  firmada por roles, disponible únicamente sobre fixtures.
- Dockerfile, `.env.example`, calidad básica y esta documentación.

Aceptación:

- Arranca con `APP_DATA_SOURCE=fixtures` y sin red/secretos.
- No existen datos reales ni llamadas a servicios remotos.
- Navegación principal usable en 375, 768 y 1440 px.
- Build, lint y typecheck limpios; unitarias disponibles pasan.
- Textos no atribuyen garantías, contratación o supervisión a Red Técnicos Chile.

**Punto de detención:** revisar visualmente la UI y aprobar la base antes de
iniciar migraciones o integraciones.

La sesión por roles del ciclo 1 es solo un mecanismo de revisión del prototipo;
no adelanta ni reemplaza Supabase Auth, verificación, RLS o 2FA del ciclo 3.

## Ciclo 2 — PostgreSQL, Supabase, Storage y RLS

**Objetivo:** implementar la capa persistente en un stack nuevo y desechable.

Entregables:

- Supabase CLI 2.109.1, migraciones, tipos generados y seed demo separado.
- Entidades, constraints, estados, proyección pública y cálculo de puntuación.
- Catálogo oficial de 16 regiones y 346 comunas, con fuente documentada.
- Siete buckets, cuarentena, políticas de objetos y metadatos.
- RLS para cada rol y pgTAP para aislamiento, publicación, puntuación y Storage.
- Scripts PowerShell/Bash de preflight, backup, dry-run, aplicación, verificación
  y generación de tipos.

Aceptación:

- Todas las tablas expuestas tienen RLS y pruebas negativas.
- Visitante solo lee la proyección aprobada; propietario no cruza límites.
- Demos se excluyen en SQL de ranking, analítica y reportes.
- `db-push` es dry-run por defecto y no utiliza la instancia compartida.

## Ciclo 3 — Autenticación y registro voluntario

**Objetivo:** permitir que técnicos y empresas inicien y presenten su propia
postulación.

Entregables:

- Registro, login, verificación, recuperación y protección de rutas.
- Formulario breve con borrador persistente: cuenta, perfil profesional,
  servicios, cobertura y aceptación. Galería y antecedentes adicionales se
  completan después desde el panel.
- Consentimientos versionados y autorización explícita de publicación.
- Carga a cuarentena, validación, re-codificación y ClamAV.
- Adaptador Resend y notificaciones operativas de postulación.

Aceptación:

- No se puede postular sin correo confirmado ni aceptaciones obligatorias.
- Un propietario solo ve/modifica sus borradores.
- Los cambios sensibles no se publican directamente.
- Recuperación y registro no enumeran usuarios; Turnstile y rate limit operan.

## Ciclo 4 — Directorio y contacto

**Objetivo:** completar la experiencia pública de búsqueda, comparación y
contacto sin cuenta.

Entregables:

- Directorio con filtros y ordenamientos del MVP; sin distancia geográfica.
- Perfiles con evidencia revisada, galería y contacto fijo en escritorio.
- Solicitud pública protegida, aviso de responsabilidad versionado y enlace
  opaco de seguimiento.
- Ciclo de estados de solicitud y correos operativos.

Aceptación:

- La API nunca entrega campos privados ni perfiles suspendidos/eliminados.
- Token de seguimiento hasheado, limitado y con vencimiento.
- Contacto funciona sin cuenta con Turnstile, rate limit y consentimiento.
- SEO, teclado y responsive cubren páginas públicas principales.

## Ciclo 5 — Paneles, moderación, puntuación y evaluaciones

**Objetivo:** cerrar el ciclo operativo del profesional y la administración.

Entregables:

- Panel de perfil, puntaje, solicitudes, documentos, galería y revisiones.
- Cola de moderación y decisiones: aprobar, cambios, rechazo, suspensión y
  reactivación, todas auditadas.
- Última versión aprobada mientras cambios sensibles están pendientes.
- Puntuación determinista e historial de correcciones justificadas.
- Evaluación única después de solicitud completada y correo verificado.

Aceptación:

- Matriz de roles probada de extremo a extremo.
- Técnico no aprueba evidencia, altera puntaje ni ve datos ajenos.
- Una edición pendiente no modifica la ficha pública.
- Todas las decisiones administrativas críticas generan auditoría.

## Ciclo 6 — QA integral y preparación de staging

**Objetivo:** dejar una versión candidata, sin publicar producción.

Entregables:

- Vitest para validación, puntaje, transiciones, consentimiento, tokens y
  publicación; pgTAP para RLS; Playwright/axe para flujos principales.
- Regresión visual en 375, 768 y 1440 px y Lighthouse de páginas públicas.
- GitHub Actions para lint, tipos, unitarias, build, migraciones, RLS,
  Playwright y auditoría; sin deploy productivo automático.
- Imagen Docker, health check, guías de backup/rollback y configuración de
  staging en Dokploy.
- Después de aprobar la UI, guía visual y banners Canva de 1920×640 y 1080×1080;
  no modificar DNS de `redtecnicos.cl`.

Aceptación:

- Todas las suites pasan y Lighthouse alcanza al menos 90 en accesibilidad,
  mejores prácticas y SEO en páginas públicas principales.
- Restauración, rollback, secretos, ClamAV, correo y HTTPS se verifican en
  staging dedicado.
- No hay datos reales, filtraciones, demos en analítica ni despliegue de
  producción.

## Riesgos y mitigaciones

- **Legal y responsabilidad:** revisión jurídica chilena antes de datos reales;
  lenguaje consistente de directorio y consentimiento versionado.
- **Instancia compartida insegura:** no reutilizarla; separar desarrollo,
  staging y producción con credenciales propias.
- **RLS incompleta:** inventario automático de tablas y pruebas negativas por
  rol antes de cada avance.
- **Archivos maliciosos:** cuarentena, validación, ClamAV y fallo cerrado.
- **PII en fixtures/logs:** revisión humana, allowlists y redacción centralizada.
- **Alcance excesivo:** conservar pagos, SMS, distancia, comisiones y
  multiusuario empresarial avanzado fuera del MVP.

## Primer sprint recomendado

Finalizar y aprobar el ciclo 1: shell, tokens visuales, landing, directorio,
perfil demo, adaptador fixtures, contratos, documentación y pruebas base. Solo
después de esa revisión se crea el stack Supabase local del ciclo 2.
