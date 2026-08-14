# Contribuir

## Principios

Este es un proyecto privado. Contribuir no autoriza crear repositorios, hacer
push, abrir recursos remotos, desplegar, migrar bases, cambiar DNS/Dokploy ni
modificar DNS de `redtecnicos.cl`. Esas acciones requieren autorización expresa del
propietario.

No se aceptan perfiles extraídos de internet, scraping, bases de terceros ni
datos personales reales sin autorización verificable. Los datos de desarrollo
deben ser claramente ficticios y estar marcados como demo.

## Preparación local

1. Usar Node.js 24 y npm.
2. Copiar `.env.example` a `.env.local` sin versionar.
3. Mantener `APP_DATA_SOURCE=fixtures` y
   `NEXT_PUBLIC_ENABLE_DEMO_PROFILES=true` durante el ciclo 1.
4. Instalar desde el lockfile y ejecutar la aplicación local.
5. No agregar credenciales de la instancia Supabase compartida.

## Ramas y cambios

- `main`: producción futura; protegida.
- `develop`: integración y staging futuro.
- `feature/<descripcion>`: una funcionalidad coherente y acotada.
- `fix/<descripcion>`: corrección acotada.

No desplegar ramas feature. Mantener commits pequeños y descriptivos; no mezclar
refactors no relacionados. No hacer push o merge mientras no exista autorización
y repositorio privado confirmado.

## Ciclo de contribución

1. **Analizar:** revisar código, arquitectura, dependencias, permisos y riesgos.
2. **Planificar:** delimitar archivos, migraciones, variables y pruebas.
3. **Implementar:** una unidad coherente, modular y con TypeScript estricto.
4. **Probar:** lint, tipos, unitarias, integración/build, RLS y responsive según
   el alcance.
5. **Revisar seguridad:** autorización, validación, PII, archivos, logs y secretos.
6. **Documentar:** actualizar documentos y changelog relevantes.
7. **Informar:** cambios, pruebas, resultados, migraciones y riesgos.
8. **Detenerse:** esperar revisión; no realizar acciones remotas implícitas.

## Estándares de código

- TypeScript estricto; evitar `any` y validar límites externos con Zod.
- Separar componentes visuales, casos de uso, repositorios e integraciones.
- No acceder directamente a Supabase desde componentes de presentación.
- Mantener contratos API `{ data, error, meta }` y errores seguros.
- Diseñar mobile-first, con teclado, foco visible, labels y contraste WCAG 2.2 AA.
- Usar lenguaje de directorio: nunca “técnico garantizado”, “nuestros técnicos”
  ni afirmaciones de garantía o recomendación oficial.
- Agregar pruebas al corregir defectos o incorporar reglas de negocio.

## Calidad antes de revisión

Ejecutar los scripts que existan en `package.json`:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

Desde el ciclo 2 se agregan pgTAP y pruebas RLS; desde los ciclos 4–6, Playwright,
axe y regresión responsive. No usar un formateador con escritura sobre archivos
no relacionados.

## Cambios de base de datos

- Probar primero en un Supabase local/desechable, nunca en el compartido.
- Crear una migración nueva; no reescribir migraciones aplicadas.
- Incluir constraints, índices, RLS y pruebas negativas en el mismo cambio.
- Mantener `db-push` en dry-run por defecto y comprobar explícitamente el destino.
- Staging necesita `--apply`; producción necesita confirmación exacta, backup
  verificado y autorización expresa.
- No usar `supabase link` con Supabase self-hosted.

## Datos y archivos de prueba

- Usar nombres que incluyan “Demo”, “Ejemplo” o “Ficticio”.
- No usar teléfonos, correos, RUT, domicilios o fotografías de personas reales.
- Usar dominios reservados como `example.test` cuando se necesiten emails.
- Marcar `is_demo=true` y probar su exclusión de analítica/ranking.
- No versionar documentos privados, archivos de cuarentena ni backups.

## Revisión de cambios

Una propuesta debe indicar objetivo, capturas para cambios visuales, pruebas
ejecutadas, riesgos, variables nuevas, migraciones y efecto sobre privacidad.
Cambios de autorización, RLS, publicación, puntaje, retención, archivos o roles
requieren una revisión de seguridad dedicada.

## Vulnerabilidades

No crear issues públicos con detalles explotables o datos de usuario. Escalar por
el canal privado designado por Red Técnicos Chile y evitar probar contra producción.
