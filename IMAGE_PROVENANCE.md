# Procedencia de imágenes de demostración

## Alcance

Las imágenes de `public/images` se usan exclusivamente para revisar localmente
la experiencia visual de **Red Técnicos Chile**. Se sirven desde la aplicación,
no dependen de URLs externas y están rotuladas como ilustrativas cuando aparecen
en galerías o perfiles ficticios.

## Referencia autorizada

La estructura visual y cuatro escenas base provienen de la página compartida por
el propietario del proyecto en:

`https://chat.qwen.ai/s/deploy/t_b5e52f34-7545-4165-87e6-79fe89e89814`

- `categories/industrial.webp`: escena industrial conservada.
- `categories/commercial.webp`: escena comercial conservada.
- `categories/residential.webp`: escena residencial adaptada con un técnico
  latinoamericano adulto ficticio.
- `reference/hero-red-tecnicos.webp`: hero adaptado con un técnico
  latinoamericano adulto ficticio.

Las adaptaciones de personas y las nueve imágenes de `images/gallery` fueron
generadas para esta demo mediante edición/generación de imagen asistida por IA.
No representan técnicos, clientes, empresas, ubicaciones ni trabajos reales.

## Tratamiento técnico

- Formato final WebP y dimensiones reservadas mediante `next/image`.
- Archivos fuente y PNG de trabajo excluidos del paquete final.
- Textos alternativos descriptivos en las vistas públicas y administrativas.
- En producción, las fotografías declaradas por profesionales deberán pasar por
  autorización, límites de tamaño, re-codificación sin EXIF, análisis de
  seguridad, moderación y estado aprobado antes de publicarse.

La autorización de uso y el alcance jurídico de las imágenes de referencia
deben ratificarse antes de publicar el dominio productivo.
