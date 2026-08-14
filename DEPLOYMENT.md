# Despliegue

## Estado y prohibiciones del ciclo 1

Este documento es una guía de preparación. En el ciclo 1 **no se despliega** y
no se modifica GitHub remoto, Dokploy, Supabase remoto ni DNS de `redtecnicos.cl`.
Los dominios y nombres indicados son objetivos futuros, no recursos confirmados.

No ejecutar ningún paso de staging o producción sin autorización expresa del
propietario y sin completar las barreras de [SECURITY.md](./SECURITY.md).

## Matriz de ambientes

| Configuración | Local | Staging | Producción |
| --- | --- | --- | --- |
| Datos | Fixtures / Supabase desechable | Supabase dedicado | Supabase dedicado |
| Rama | feature | `develop` | `main` |
| URL prevista | `localhost:3000` | `staging.redtecnicos.cl` | `redtecnicos.cl` |
| Demos | Habilitados | Habilitados y rotulados | Deshabilitados |
| Correo | Adaptador de consola/sandbox | Dominio sandbox | Dominio verificado |
| ClamAV | Requerido al probar cargas | Obligatorio | Obligatorio, fallo cerrado |

Cada ambiente usa sus propias claves, base, Storage, correo, Turnstile y
configuración. No se copian datos reales entre ambientes.

## Imagen Docker

La aplicación objetivo usa un Dockerfile multi-stage con Node.js 24 y
`output: "standalone"`:

1. `deps`: instala exactamente el lockfile con `npm ci`.
2. `builder`: ejecuta pruebas necesarias y `npm run build`.
3. `runner`: copia `.next/standalone`, `.next/static` y `public`.
4. El proceso corre como usuario no root, escucha `0.0.0.0:3000` y recibe
   secretos solo en tiempo de ejecución.

La imagen no debe contener `.env.local`, credenciales, fuentes de datos reales,
backups, documentos privados ni herramientas administrativas innecesarias.

## Variables

El inventario definitivo vive en `.env.example`. Se esperan, por categoría:

- Aplicación: entorno, URL, versión, fecha de build y origen de datos.
- Supabase: URL y anon key públicas; service role solo de servidor.
- Turnstile: site key pública y secret solo de servidor.
- Resend: API key, remitente y modo sandbox.
- Seguridad: claves de hash/rotación y configuración de cookies.
- Carga: URL/estado ClamAV, tamaños y tipos permitidos.
- Retención y flags: periodos y `NEXT_PUBLIC_ENABLE_DEMO_PROFILES`.

Los secretos se cargan desde Dokploy; no se hornean como `ARG`, no se imprimen
en logs y no se versionan.

## Endpoint de salud

`GET /api/health` responde únicamente estado de aplicación, conectividad básica,
versión y fecha de compilación. Un ejemplo admisible:

```json
{
  "status": "ok",
  "database": "reachable",
  "version": "1.0.0",
  "builtAt": "2026-07-12T00:00:00Z"
}
```

No devuelve hosts, nombres de base, esquemas, versiones internas, latencias
detalladas, trazas ni mensajes de excepción. En fixtures, `database` puede ser
`not_configured` sin considerar la aplicación caída.

## Scripts seguros de base de datos

Desde el ciclo 2 se proporcionarán equivalentes PowerShell y Bash:

- `preflight`: valida ambiente, binarios, destino y migraciones.
- `backup`: crea un backup cifrado y verifica integridad.
- `db-push`: muestra dry-run por defecto.
- `verify`: comprueba migraciones, RLS, buckets y health.
- `generate-types`: actualiza tipos desde el esquema esperado.

Staging requiere el argumento explícito `--apply`. Producción requiere una frase
de confirmación exacta, destino verificado y evidencia de backup/restauración.
No usar `supabase link` con la instalación self-hosted. Ningún script debe
seleccionar producción como valor por defecto.

## Preparación de Dokploy para staging

Cuando se autorice el ciclo 6:

1. Confirmar que el repositorio es privado y conectar credenciales de solo el
   alcance necesario.
2. Crear una aplicación separada “red-tecnicos-staging” sobre `develop`.
3. Elegir build por Dockerfile, puerto 3000 y health check `/api/health`.
4. Ingresar variables del ambiente sin reutilizar producción.
5. Vincular únicamente el Supabase dedicado de staging.
6. Configurar el subdominio previsto y HTTPS.
7. Definir límites de recursos, retención de logs y política de reinicio.
8. Desplegar, ejecutar smoke tests, RLS, Playwright y revisión de logs.
9. Ensayar backup/restauración y rollback a la imagen anterior.

Crear estos recursos es una acción remota y necesita autorización en ese momento.

## Preparación de producción

Producción es una aplicación Dokploy separada sobre `main`; no comparte base,
buckets, secretos ni colas con staging. El despliegue no es automático desde
feature ni se promociona una migración sin validación previa.

Orden de una publicación autorizada:

1. Aprobar revisión legal, seguridad, QA y ventana de cambio.
2. Verificar backup y restauración; registrar imagen y migración objetivo.
3. Aplicar migraciones compatibles hacia adelante y verificarlas.
4. Desplegar la imagen inmutable con demos deshabilitados.
5. Ejecutar health, smoke tests y controles de privacidad/RLS.
6. Monitorear errores y métricas mínimas sin PII.
7. Confirmar o ejecutar rollback documentado.

## Rollback

- Código: volver a la imagen inmutable anterior, no reconstruir una rama antigua.
- Base: preferir migraciones compatibles hacia adelante; una reversión destructiva
  exige plan específico y restauración probada.
- Configuración: conservar una versión previa validada y rotar secretos si hubo
  exposición.
- Archivos: no hacer borrados masivos; aislar objetos afectados y conservar
  trazabilidad.

## GitHub Actions

El pipeline objetivo ejecuta lint, typecheck, unitarias, build, auditoría,
pruebas de migración/RLS y Playwright. No contiene secretos de producción en pull
requests, no despliega ramas feature y no efectúa despliegue productivo automático.

## Lista de salida

No habilitar producción hasta verificar: autorización expresa, revisión legal,
Supabase independiente, RLS completa, backups restaurables, SMTP/Resend, ClamAV,
Turnstile, HTTPS, 2FA admin, secretos rotados, health check, rollback, monitoreo y
respuesta a incidentes.
