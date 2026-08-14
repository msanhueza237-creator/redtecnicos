# Changelog

Todos los cambios relevantes del proyecto se documentan aquí siguiendo una
estructura inspirada en Keep a Changelog. El proyecto aún no tiene una versión
productiva.

## Unreleased

### Added

- Nueva identidad **Red Técnicos Chile**, portada fotográfica, buscador por
  categoría y región, tres áreas técnicas, seis perfiles destacados, recorridos
  separados para clientes y profesionales, testimonios rotulados y CTA legal.
- Trece fotografías WebP locales: cuatro piezas principales y nueve trabajos de
  galería distribuidos entre industrial, comercial y residencial.
- Modelo `ProfessionalCategory`, formación mediante `Qualification`, proyección
  pública limitada a antecedentes revisados y máximo de tres imágenes aprobadas.
- Panel profesional con Formación y galería editable de tres espacios; bandeja
  administrativa de Galerías y decisiones demo con motivo obligatorio.
- Actualización de Next.js 16.2.10 a 16.3.1 para incorporar correcciones de
  seguridad indicadas por `npm audit` en agosto de 2026.

- Documentación inicial de arquitectura, base de datos, seguridad, desarrollo,
  despliegue y contribución.
- Definición del ciclo 1 basado exclusivamente en fixtures ficticios.
- Hoja de ruta y criterios de aceptación para los ciclos 2–6.
- Barreras explícitas para impedir acceso accidental a Supabase compartido,
  GitHub remoto, Dokploy, DNS de `redtecnicos.cl` o producción.
- Aplicación Next.js navegable con landing, directorio filtrable, diez perfiles
  ficticios, registro por etapas, panel profesional y moderación simulada.
- Ingreso profesional visible y acceso administrativo demo separado, directo y
  no enlazado públicamente; ambos protegidos por sesión local firmada y guardas
  de servidor, deshabilitados fuera del origen `fixtures`.
- Área administrativa independiente con dashboard, doce secciones navegables,
  ficha de postulación, estado activo y acciones explícitamente no persistentes.
- Perfil de revisión **Administrador** con acceso a las doce secciones, incluida
  configuración; los roles internos más granulares quedan reservados para la
  política Supabase/RLS futura.
- Navegación pública dependiente de la sesión y barra inferior móvil tipo app:
  sin sesión muestra Ingreso profesional, al técnico Mi panel y al administrador
  Administración.
- Panel profesional completo con shell responsive y diez rutas navegables:
  resumen, perfil, servicios, cobertura, documentos, formación, galería, solicitudes,
  evaluaciones y configuración.
- Ejemplos interactivos seguros para editar datos ficticios, cambiar estados,
  simular renovación documental y seguimiento de solicitudes sin persistencia,
  carga de archivos ni tráfico a servicios externos.
- Solicitud de contacto inmediata con nombre, correo, celular, comuna, servicio,
  descripción y consentimiento; al registrar se revelan los canales ficticios
  autorizados del profesional y un folio copiable.
- Historial privado de solicitudes capturadas, con datos del cliente visibles
  solo en administración y sin exposición de tokens ni hashes.
- Repositorio temporal de fixtures, token opaco de 256 bits almacenado como hash,
  contactos profesionales separados de la proyección pública y API cerrada
  fuera del modo demo.
- Contratos Zod, API de directorio basada en fixtures y health check mínimo.
- Dockerfile `standalone`, configuración estricta, CI y pruebas unitarias/E2E.

### Validated

- ESLint sin advertencias, TypeScript estricto, 25 pruebas unitarias y build de
  producción.
- 67 escenarios Playwright aprobados en móvil, tablet y escritorio, más ocho
  omisiones intencionales de pruebas exclusivas del breakpoint móvil; incluyen
  acceso, autorización, navegación, cierre de sesión y overflow administrativo.
- Auditoría npm sin vulnerabilidades conocidas al cerrar el ciclo.

### Security

- Definido el aislamiento obligatorio de ambientes, la proyección pública, RLS,
  cuarentena de archivos, ClamAV, minimización de PII y exclusión SQL de demos.
- Cookie demo `HttpOnly`, `SameSite=Strict`, HMAC y expiración de ocho horas;
  guardas de rol ejecutadas en layouts del servidor y logout con origen validado.

### Pending

- Migraciones, RLS y Storage en un stack desechable durante el ciclo 2.
- Revisión jurídica chilena antes de trabajar con datos reales o producción.

## 0.1.0 - 2026-07-12

### Added

- Inicio del ciclo 1 y definición de “Red Técnicos Chile” como
  directorio informativo de registro voluntario.

No existe ni debe crearse un repositorio público sin autorización expresa.
