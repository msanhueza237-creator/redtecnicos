# Arquitectura

## Objetivo y estado

La solución es una única aplicación Next.js modular, responsive y orientada a
dominios. En el ciclo 1 el origen de datos es `fixtures`: la interfaz debe poder
navegarse sin red y sin secretos. La infraestructura Supabase descrita aquí es
la arquitectura de los ciclos 2–5, no una conexión activa.

## Límites del sistema

La aplicación es un directorio y canal de contacto. Quedan fuera del MVP:
pagos, comisiones, presupuestos, asignación automática, supervisión de trabajos,
SMS, multiusuario empresarial completo, distancia geográfica y analítica
avanzada.

Los componentes externos previstos son:

- Supabase dedicado por ambiente: PostgreSQL, Auth y Storage.
- Resend detrás de un adaptador de correo.
- Cloudflare Turnstile para formularios públicos.
- ClamAV para analizar documentos antes de publicarlos o almacenarlos como
  definitivos.
- Dokploy como orquestador de la imagen Docker.

Ninguno de estos servicios debe recibir tráfico del ciclo 1.

## Módulos

```text
app/
  (public)/              landing, directorio, perfiles y páginas informativas
  (auth)/                ingreso, recuperación y verificación
  panel/                 experiencia del técnico o empresa
  admin/                 moderación y administración
  api/
    health/              estado mínimo de la aplicación
    v1/                  API interna versionada
components/              sistema visual y piezas compartidas
domains/
  directory/             consultas y proyección pública
  identity/              usuarios, roles y sesiones
  professionals/         perfil, servicios, cobertura y puntuación
  applications/          postulación, revisiones y publicación
  contact-requests/      solicitudes, seguimiento y evaluaciones
  moderation/            documentos, decisiones, reclamos y auditoría
lib/                     configuración, seguridad e integraciones
fixtures/                datos exclusivamente ficticios
supabase/                migraciones, seed y pruebas desde ciclo 2
tests/                   unitarias, integración y end-to-end
```

La estructura física puede adaptarse a las convenciones del proyecto, pero
estos límites de dominio deben conservarse. Los componentes de interfaz no
acceden directamente a Supabase: consumen repositorios o servicios de dominio.

## Flujo de datos

```text
Navegador
   │
   ├── Server Components ── servicios de dominio ── repositorio fixtures
   │                                              └─ repositorio Supabase (ciclo 2+)
   │
   └── formularios ── Route Handlers ── Zod ── autorización ── caso de uso
                                                    │
                                                    ├─ PostgreSQL/RLS
                                                    ├─ Storage/cuarentena
                                                    └─ correo/Turnstile
```

Las claves privilegiadas y el acceso administrativo existen únicamente en el
servidor. RLS es defensa obligatoria aunque el Route Handler ya haya autorizado
la acción.

### Contacto inmediato

En modo fixtures, `POST /api/v1/contact-requests` valida nombre, correo,
celular, comuna, servicio, descripción y consentimiento. El contacto ficticio
del profesional se mantiene separado de `directory_profiles` y solo se entrega
en la respuesta exitosa. La solicitud queda en un repositorio temporal en
memoria; el token opaco se devuelve una vez y el historial conserva únicamente
su hash SHA-256.

El enlace privado abre `GET /api/v1/contact-requests/[trackingToken]` con
respuestas `no-store`. El cliente puede confirmar la finalización mediante la
ruta `complete` y enviar una sola evaluación. La opinión nace en estado
`pending`; no modifica la calificación pública hasta una decisión de
moderación. En producción el enlace deberá enviarse al correo verificado de la
solicitud.

Al conectar Supabase, el mismo contrato deberá persistir en PostgreSQL con RLS,
Turnstile y rate limiting. El cliente verá el canal autorizado inmediatamente;
el profesional correspondiente y los roles operacionales verán la solicitud en
su historial privado. Ningún correo o celular se añadirá a la proyección pública
del directorio.

## API interna

Los Route Handlers entregan un contrato estable:

```ts
type ApiResponse<T> = {
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: Record<string, unknown>;
};
```

Rutas objetivo:

| Método y ruta | Propósito | Acceso |
| --- | --- | --- |
| `GET /api/health` | Estado, versión, compilación y conectividad básica | Público |
| `GET /api/v1/directory/profiles` | Directorio filtrado | Público |
| `GET /api/v1/directory/profiles/[slug]` | Perfil publicado | Público |
| `POST /api/v1/contact-requests` | Crear solicitud y seguimiento opaco | Público protegido |
| `GET /api/v1/contact-requests/[trackingToken]` | Ver seguimiento privado | Titular del token opaco |
| `POST /api/v1/contact-requests/[trackingToken]/complete` | Confirmar trabajo realizado | Titular del token opaco |
| `POST /api/v1/profiles/submit` | Enviar postulación | Propietario |
| `POST /api/v1/profiles/uploads` | Iniciar carga controlada | Propietario |
| `POST /api/v1/admin/profile-decisions` | Aprobar, pedir cambios, rechazar o suspender | Moderación autorizada |
| `POST /api/v1/reviews` | Crear una evaluación pendiente para una solicitud completada | Cliente verificado |

Los filtros públicos incluyen categoría industrial/comercial/residencial,
región, comuna, servicio, tipo de entidad,
revisiones, disponibilidad, modalidad, vehículo, experiencia y calificación.
La cercanía no se implementa en el MVP.

## Publicación segura

`directory_profiles` es la única proyección pública. Contiene solo campos
aprobados y no se compone en el navegador a partir de tablas privadas. Una nueva
edición sensible se guarda como revisión pendiente; la proyección mantiene la
última versión aprobada hasta una decisión administrativa.

Estados del perfil: `draft`, `submitted`, `under_review`, `changes_requested`,
`approved`, `verified`, `suspended`, `rejected`, `deleted` y
`expired_documents`. Las transiciones se implementan como casos de uso
auditados, nunca como cambios arbitrarios desde la interfaz.

La ficha pública proyecta únicamente `qualifications` revisadas y un máximo de
tres `portfolio_images` aprobadas. El panel permite completar ambos antecedentes
después del registro breve; el administrador los modera por separado y siempre
registra un motivo para una decisión sensible.

## Autenticación y autorización

Los roles son `visitor`, `customer`, `technician`, `company`, `moderator`,
`admin` y `superadmin`. El rol de aplicación se resuelve desde tablas controladas
por el servidor; no se acepta un rol enviado por el cliente.

- Visitante: solo lectura pública y creación protegida de solicitudes.
- Cliente: seguimiento propio, reporte y evaluación elegible.
- Técnico/empresa: administración de sus propios recursos.
- Moderador: revisión de módulos asignados, sin configuración crítica.
- Admin: gestión operativa y suspensión.
- Superadmin: roles, seguridad e integraciones.

La autorización se prueba en dos niveles: caso de uso y políticas RLS.

El shell público recibe únicamente el rol ya resuelto por el servidor. Con una
sesión técnica muestra el panel profesional; con una sesión administrativa
muestra Administración; sin sesión solo muestra Ingreso profesional. El
navegador no interpreta cookies ni decide permisos. En el ciclo de integración,
este resolvedor se conectará a Supabase Auth sin cambiar el contrato visual.

En pantallas pequeñas el shell añade una navegación inferior fija con accesos a
Inicio, Buscar, Cómo funciona y el área privada que corresponda al rol. La
navegación administrativa mantiene su propio shell responsive e independiente.

### Panel profesional de fixtures

`/panel` dispone de un shell privado y subrutas independientes para perfil,
servicios, cobertura, documentos, galería, solicitudes, evaluaciones y
configuración. En fixtures, los formularios e interacciones actualizan solo
estado React local para demostrar las transiciones sin persistencia. No se
renderizan controles de carga reales. Al conectar Supabase, cada acción deberá
pasar a un caso de uso de servidor con validación Zod, autorización de
propietario, RLS y auditoría según su sensibilidad.

## Archivos

La carga sigue `solicitud → cuarentena privada → validación de firma/MIME/tamaño
→ re-codificación de imagen o análisis ClamAV → bucket definitivo → revisión →
publicación, si corresponde`. La omisión de ClamAV solo puede habilitarse en un
entorno de desarrollo desechable y nunca en producción.

## Observabilidad

Los logs son estructurados y excluyen PII sensible. El endpoint de salud no
publica host, esquema, versión de PostgreSQL, claves ni mensajes de excepción.
La analítica de fichas conserva únicamente conteos diarios agregados por perfil;
no registra `session_id`, IP, cookies ni datos personales. Una llave HMAC de red
rotativa limita abuso sin incorporarse al informe, y los perfiles demo se
excluyen tanto al registrar como al consultar.

## Decisiones del ciclo 1

- Repositorio único y una sola aplicación desplegable.
- Adaptador de datos intercambiable entre fixtures y Supabase.
- Renderizado público preferentemente en servidor para rendimiento y SEO.
- Componentes móviles primero y tokens de Red Técnicos Chile: Public Sans, azul
  `#2980B9`, acción `#1F5F8F`, grafito `#333333`, blanco y lima `#C8FF55`.
- Sin acceso remoto, despliegue ni datos reales hasta completar las barreras de
  seguridad documentadas.
