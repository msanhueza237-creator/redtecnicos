# Red Técnicos Chile

MVP de un directorio informativo donde técnicos y empresas de climatización y
refrigeración se registran voluntariamente, publican un perfil sujeto a revisión
y reciben solicitudes de contacto de clientes finales.

Red Técnicos Chile facilita el descubrimiento y el contacto. No presta, contrata,
dirige ni garantiza los servicios publicados, no fija precios y no procesa
pagos en esta primera versión.

## Estado del proyecto

El proyecto se encuentra en el **ciclo 1: fundación y experiencia local**.

- La aplicación funciona con `APP_DATA_SOURCE=fixtures` y 10 perfiles
  inequívocamente ficticios.
- No requiere secretos, una cuenta Supabase ni conexión a servicios externos.
- Los perfiles demo deben mostrar “Perfil de demostración” y nunca representan
  personas, empresas, certificados, teléfonos o direcciones reales.
- Supabase, RLS, Storage, correo, CAPTCHA y Dokploy se documentan como
  arquitectura objetivo; la integración continua local/CI ya valida el shell
  y las demás capacidades se implementan en ciclos posteriores.
- Durante este ciclo está prohibido modificar DNS de `redtecnicos.cl`, GitHub
  remoto, Dokploy o cualquier Supabase remoto.

## Tecnologías objetivo

- Next.js 16.3.1 con App Router y salida `standalone`.
- React 19.2.7, TypeScript estricto y Tailwind CSS 4.3.2.
- PostgreSQL y Supabase para datos, Auth y Storage.
- Zod para contratos y validación de entrada.
- Vitest, pgTAP, Playwright y axe para calidad.
- Docker con Node.js 24 para despliegue posterior en Dokploy.

## Desarrollo local

Requisitos: Node.js 24 y npm.

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Abrir `http://localhost:3000`. El valor local obligatorio es:

```dotenv
APP_DATA_SOURCE=fixtures
NEXT_PUBLIC_ENABLE_DEMO_PROFILES=true
```

Antes de entregar cambios, ejecutar los scripts disponibles en `package.json`:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

No se debe configurar una URL o una clave de un Supabase compartido para probar
el ciclo 1. Consultar [SECURITY.md](./SECURITY.md) antes de agregar integraciones.

## Accesos privados de demostración

El encabezado público muestra **Ingreso profesional** y abre
`http://localhost:3000/acceso-demo`. Ese acceso inicia exclusivamente la sesión
de técnico y lleva a `/panel`.

Para revisar localmente el perfil único de administrador existe la ruta directa
`http://localhost:3000/acceso-demo/administracion`. Esta URL no se enlaza desde
la navegación pública. Al iniciar esa sesión, el encabezado pasa a mostrar
**Administración** y el perfil puede revisar las doce secciones de `/admin`,
incluida configuración.

Ambas sesiones usan una cookie firmada, `HttpOnly`, `SameSite=Strict` y con ocho
horas de vigencia. Ocultar la ruta administrativa no constituye un control de
seguridad: el acceso efectivo se valida en el servidor antes de renderizar cada
área privada.

Este acceso solo funciona con `APP_DATA_SOURCE=fixtures` y
`DEMO_AUTH_ENABLED=true`. No es el login productivo, no crea usuarios y no
autoriza conectar datos reales. Antes de cambiar el origen de datos, el
resolvedor de sesión del servidor se debe reemplazar por Supabase Auth con
correo/contraseña, rol administrativo en base de datos, RLS y 2FA. Solo después
de esa validación el servidor podrá entregar el enlace **Administración**.

### Panel profesional funcional

La sesión técnica abre `/panel` y permite recorrer rutas reales para resumen,
perfil, servicios, cobertura, documentos, formación, galería, solicitudes, evaluaciones y
configuración. Los ejemplos interactivos permiten editar el perfil, pausar un
servicio, ajustar cobertura, simular una renovación, editar tres trabajos,
declarar formación y avanzar una solicitud ficticia.

Todos esos cambios viven únicamente en el estado de la pantalla y desaparecen
al recargar. La demo no abre selectores de archivos, no transmite contactos y
no escribe en una base de datos. Los clientes usan correos `.invalid` y
teléfonos marcados expresamente como ficticios.

## Recorrido funcional del MVP

La experiencia objetivo comprende:

1. Un visitante busca y filtra técnicos o empresas.
2. Revisa un perfil público compuesto exclusivamente por datos aprobados.
3. Envía una solicitud de contacto sin crear una cuenta, recibe inmediatamente
   el correo y celular autorizado del profesional y obtiene un token opaco de
   seguimiento. En fixtures, el historial existe solo durante la ejecución.
4. Un profesional se registra voluntariamente, completa el formulario por
   etapas, acepta documentos versionados y envía su postulación.
5. Moderación revisa identidad, títulos, capacitaciones, galería y documentos privados.
6. El perfil aprobado se publica; una edición sensible posterior no reemplaza
   la última versión aprobada hasta completar una nueva revisión.
7. El cliente abre el seguimiento mediante el token opaco, confirma que el
   trabajo fue realizado y puede originar una sola evaluación, inicialmente
   pendiente de moderación. En producción el enlace se enviará al correo
   verificado de la solicitud.

## Principios no negociables

- No hacer scraping, importar directorios ni crear perfiles desde datos de
  terceros.
- No publicar un perfil sin registro voluntario o autorización expresa
  verificable.
- No exponer RUT, identidad, dirección particular, documentos completos,
  información bancaria, notas internas ni reclamos privados.
- No usar mensajes como “técnico garantizado” o “nuestros instaladores”.
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al navegador ni registrar secretos,
  tokens, contraseñas o contenido de documentos privados.
- No mezclar perfiles demo con rankings, analítica o exportaciones reales.
- No hacer `git push`, merge, despliegue, migración remota o cambio de DNS sin
  autorización expresa del propietario.

## Documentación

- [ARCHITECTURE.md](./ARCHITECTURE.md): módulos, límites y flujos.
- [DATABASE.md](./DATABASE.md): modelo relacional, publicación, RLS y retención.
- [SECURITY.md](./SECURITY.md): controles, amenazas y barreras de lanzamiento.
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md): ciclos 1–6 y aceptación.
- [DEPLOYMENT.md](./DEPLOYMENT.md): preparación de staging y producción.
- [CONTRIBUTING.md](./CONTRIBUTING.md): flujo seguro de colaboración.
- [CHANGELOG.md](./CHANGELOG.md): historial de entregas.
- [IMAGE_PROVENANCE.md](./IMAGE_PROVENANCE.md): procedencia y tratamiento de imágenes demo.

## Ambientes previstos

| Ambiente | Rama | Datos | Dominio previsto |
| --- | --- | --- | --- |
| Local | feature/local | Fixtures o Supabase local desechable | `localhost:3000` |
| Staging | `develop` | Supabase dedicado de staging | `staging.redtecnicos.cl` |
| Producción | `main` | Supabase dedicado de producción | `redtecnicos.cl` |

Staging y producción no están creados ni autorizados en el ciclo 1.

## Licencia y revisión legal

Uso privado de Red Técnicos Chile. Términos, privacidad, avisos de responsabilidad,
retención y tratamiento de datos requieren revisión jurídica chilena antes de
habilitar datos reales o publicar el servicio.
