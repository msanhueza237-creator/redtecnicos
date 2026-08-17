# Seguridad de documentos profesionales

## Flujo operativo

1. El técnico o la empresa debe tener una sesión Supabase activa.
2. La aplicación limita el archivo a 10 MB y acepta únicamente PDF, JPG o PNG.
3. El backend compara el MIME declarado con la firma real del archivo. Las imágenes se vuelven a codificar para eliminar metadatos.
4. El archivo se guarda temporalmente en el bucket privado `quarantine`.
5. El backend transmite el contenido a ClamAV por la red privada de Docker, sin publicar el puerto 3310.
6. Si el resultado es limpio, una conexión `service_role` lo escribe en `qualification-documents` y elimina la copia de cuarentena. En cualquier error el flujo se cierra y no publica el archivo.
7. Solo el propietario y los roles administrativos pueden solicitar un enlace firmado de cinco minutos.
8. Un moderador, administrador o superadministrador aprueba, solicita cambios o rechaza con un motivo auditado.
9. El directorio público recibe solamente tipo, nombre, institución, año y vencimiento de credenciales aprobadas. Nunca recibe la ruta ni el contenido del archivo.

## Variables privadas

- `SUPABASE_SERVICE_ROLE_KEY`: llave privada del stack Supabase. Solo debe existir en el entorno del servidor Next.js.
- `CLAMAV_HOST`: nombre DNS privado; por defecto `redtecnicos-clamav`.
- `CLAMAV_PORT`: puerto privado; por defecto `3310`.
- `DOCUMENT_SCAN_MODE=disabled`: permitido únicamente durante desarrollo local. En producción se ignora el bypass y el análisis falla de forma cerrada.

## Operación

El servicio se instala con `deploy/clamav-service.sh`. Usa la imagen oficial `clamav/clamav:1.5.3`, volumen persistente para firmas y 3 GB de límite de memoria. No publica puertos hacia Internet.

Antes de una migración productiva se debe crear y verificar un respaldo PostgreSQL. Después se ejecutan pgTAP, la prueba de salud del servicio antivirus y una carga controlada con un archivo inocuo.
