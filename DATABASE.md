# Base de datos

## Estado

Este documento define el modelo objetivo. En el ciclo 1 no se ejecutan
migraciones ni se conecta la aplicación a una base remota: los datos proceden de
fixtures ficticios. La implementación SQL, el seed y las pruebas pgTAP forman
parte del ciclo 2 y deben ejecutarse primero contra Supabase local o una instancia
de desarrollo nueva y desechable.

## Convenciones

- PostgreSQL con UUID generados por la base, `timestamptz` y nombres `snake_case`.
- Campos comunes según corresponda: `id`, `created_at`, `updated_at`,
  `created_by`, `updated_by`, `status` y `deleted_at`.
- Soft delete para perfiles, documentos, contenido moderado y solicitudes.
- Claves foráneas explícitas, índices sobre búsquedas/propiedad/estado y
  restricciones `check` para estados y límites.
- Las migraciones son inmutables después de aplicarse a un ambiente compartido.
- No almacenar IP cruda: solo hash HMAC rotativo con una clave de servidor y
  periodo de rotación.
- `is_demo boolean not null default false` en el agregado profesional y en su
  proyección pública.

## Entidades por dominio

### Identidad y consentimiento

- `profiles`: extensión privada de `auth.users` y preferencias de cuenta.
- `user_roles`: asignaciones auditables de rol; el usuario no las modifica.
- `terms_versions`: documentos legales versionados, tipo y vigencia.
- `terms_acceptances`: versión, usuario/sesión, fecha y evidencia minimizada.
- `privacy_consents`: finalidad, versión, estado y revocación.
- `publication_consents`: autorización expresa para publicar un perfil.
- `tracking_tokens`: hash del token opaco, propósito, vencimiento y consumo.

### Profesionales y cobertura

- `technicians`: datos privados y profesionales de personas independientes.
- `companies`: datos privados y comerciales de empresas.
- `company_members`: integrantes autorizados; multiusuario avanzado queda fuera
  del MVP, pero la relación no debe impedir su evolución.
- `services`: catálogo administrable de servicios.
- `technician_services`: servicios, descripción y estado de revisión.
- `regions` y `communes`: catálogo oficial de 16 regiones y 346 comunas.
- `service_areas`: cobertura por región/comuna y modalidad.
- `profile_revisions`: snapshot de cambios sensibles pendientes y decisión.
- `directory_profiles`: proyección pública denormalizada con solo información
  aprobada y última versión publicable.

### Evidencia y reputación

- `qualifications`: título profesional, título técnico o capacitación; nombre,
  institución, año, vigencia opcional, revisión y referencia a archivo privado.
  La proyección pública incluye solo metadatos con estado `reviewed`, nunca el
  documento, las observaciones internas ni antecedentes pendientes.
- `portfolio_images`: metadatos de imágenes saneadas y decisión de moderación.
- `reviews`: una evaluación por solicitud completada y cliente verificado.
- `review_moderations`: decisión, motivo, actor y fecha.
- `technician_scores`: total y desglose calculado.
- `score_history`: valor anterior/nuevo, señales, motivo y actor.
- `file_uploads`: propietario, bucket, objeto UUID, hash, MIME detectado,
  resultado antivirus y estado de revisión.

### Contacto, soporte y operación

- `contact_requests`: cliente, profesional, servicio, ubicación, canal,
  consentimiento y estado.
- `contact_request_events`: historial de estados y acciones.
- `complaints`: denuncia, gravedad, estado y resolución.
- `admin_notes`: notas internas nunca visibles en el directorio.
- `audit_logs`: acción, actor, recurso, motivo y diferencias minimizadas.
- `analytics_events`: evento permitido y metadatos limitados.
- `notifications` y `email_logs`: estado operativo sin cuerpo sensible.
- `rate_limits`: clave hasheada, ventana, contador y vencimiento.
- `system_settings`: configuración no secreta y versionada.

## Proyección pública

`directory_profiles` no debe incluir RUT, identidad, domicilio particular,
contactos administrativos, documentos completos, observaciones internas,
reclamos ni datos bancarios. La lectura pública exige:

```text
status IN ('approved', 'verified')
AND deleted_at IS NULL
AND (is_demo = false OR la configuración del ambiente habilita demos)
```

La exclusión de demos de ranking, analítica y reportes se implementa mediante
vistas o funciones SQL que siempre aplican `is_demo = false`; no depende de un
filtro de interfaz.

## Puntuación

El cálculo máximo es 100 y solo utiliza señales aprobadas:

| Señal | Puntos |
| --- | ---: |
| Identidad revisada | 20 |
| Correo confirmado | 5 |
| Teléfono confirmado | 5 |
| Formación revisada | 20 |
| Perfil completo | 15 |
| Galería aprobada | 3 por imagen, máximo 15 |
| Evaluaciones verificadas | 2 por evaluación, máximo 10 |
| Actividad reciente | 5 |
| Tasa de respuesta | 0–5 |

Una función de base de datos o servicio privilegiado recalcula el resultado y
escribe el historial en la misma transacción. El propietario no puede modificar
puntaje ni señales de revisión. Toda corrección administrativa exige motivo y
`audit_logs`.

## Estados e invariantes

- Una solicitud usa `new`, `viewed`, `contacted`, `accepted`, `rejected`,
  `completed`, `cancelled` o `expired`.
- Una evaluación requiere solicitud `completed`, correo verificado y ausencia
  de otra evaluación para la misma solicitud; se fuerza con constraint único.
- El token de seguimiento se almacena hasheado, expira y no revela IDs internos.
- Solo una revisión sensible pendiente puede estar activa por perfil.
- Suspender o eliminar retira la proyección pública sin borrar evidencia sujeta
  a retención.

## Diseño RLS

RLS se habilita en todas las tablas de esquemas expuestos y se prueba por rol.

| Recurso | Público | Propietario | Moderación/Admin |
| --- | --- | --- | --- |
| `directory_profiles` | `select` publicable | Igual que público | Lectura completa autorizada por módulo |
| Datos profesionales privados | Ninguno | `select/update` propios | Según rol y asignación |
| Revisiones pendientes | Ninguno | Crear/ver propias | Decidir según permiso |
| Documentos | Ninguno | Metadatos/objetos propios | Revisión asignada |
| Puntuación | Lectura del total público | Lectura propia | Recalcular/corregir con auditoría |
| Solicitudes | Crear mediante endpoint | Partes leen solo las propias | Gestión operativa autorizada |
| Evaluaciones | Solo aprobadas | Crear si elegible | Moderar, no suplantar autor |
| Auditoría/configuración | Ninguno | Ninguno | Admin limitado / superadmin crítico |

Las políticas deben derivar el usuario desde `auth.uid()` y una función segura de
roles, nunca desde parámetros de cliente. `service_role` solo se usa en backend y
no sustituye políticas en operaciones que pueden ejecutarse con sesión de usuario.

## Storage

Buckets objetivo:

- Públicos tras aprobación: `public-avatars`, `public-portfolios`.
- Privados: `private-identities`, `private-certificates`,
  `private-company-documents`, `private-complaints`.
- Procesamiento: `private-quarantine`.

Las rutas usan UUID; el nombre original se conserva, si hace falta, solo como
metadato privado saneado. Los buckets privados se entregan mediante URL firmada
breve y política específica. Se validan firma real, MIME, extensión, tamaño,
dimensiones, contenido y antivirus. Las imágenes se re-codifican para eliminar
EXIF antes de moverse a un bucket publicable.

## Retención provisional

| Clase | Valor por defecto |
| --- | --- |
| Logs técnicos | 90 días |
| Analítica | 13 meses |
| Solicitudes de contacto | 24 meses |
| Consentimientos y auditoría | 5 años |

Los plazos son configuración provisional y requieren revisión jurídica chilena.
Una solicitud de eliminación anonimiza o borra lo permitido y conserva solo la
evidencia exigida por obligaciones legítimas, con acceso restringido.

## Migraciones y verificación del ciclo 2

1. Fijar Supabase CLI 2.109.1 y levantar un stack desechable.
2. Crear migraciones por dominio, catálogos y buckets.
3. Agregar seed independiente con 10 perfiles marcados `is_demo=true`.
4. Probar constraints, transiciones, puntuación, RLS y Storage con pgTAP.
5. Generar tipos TypeScript y comprobar que no existan diferencias sin migrar.
6. Ejecutar backup y restauración de ensayo antes de usar staging.

No usar `supabase link` contra el Supabase self-hosted ni ejecutar SQL en la
instancia compartida actualmente existente.
