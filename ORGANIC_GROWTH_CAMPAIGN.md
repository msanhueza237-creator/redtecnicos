# Campaña orgánica: “Encuentra al técnico correcto”

## Objetivo de 90 días

Generar demanda orgánica para Red Técnicos Chile y convertirla en solicitudes de
contacto válidas, sin inversión publicitaria. La campaña combina intención de
búsqueda, contenido educativo y distribución mediante los propios profesionales
de la red.

La promesa comunicacional es:

> Compara servicios, cobertura e información publicada antes de solicitar
> contacto directo.

No usar “técnicos garantizados”, “nuestros técnicos”, “los mejores” ni promesas
de disponibilidad o calidad que la plataforma no pueda acreditar.

## Públicos y recorrido

### Demanda principal: clientes

- Hogares que necesitan instalar o mantener aire acondicionado.
- Comercios y gastronomía con equipos de refrigeración.
- Empresas con cámaras de frío o sistemas de conservación.
- Administradores de edificios, oficinas y pequeños negocios.

Recorrido esperado:

1. Descubre una guía o página de servicio en Google o redes sociales.
2. Entiende qué información reunir y qué comparar.
3. Revisa perfiles filtrados por servicio y ubicación.
4. Registra una solicitud de contacto.
5. Completa seguimiento y evaluación cuando corresponda.

### Oferta que amplifica: técnicos y empresas

Cada profesional aprobado recibe una URL pública que puede compartir. Esta es la
palanca de distribución gratuita: el perfil aporta alcance a la red y la red le
aporta una vitrina y solicitudes.

## Mapa de búsquedas

| Intención | Búsquedas objetivo | Página principal |
| --- | --- | --- |
| Contratar instalación | instalación aire acondicionado, instalador aire acondicionado | `/servicios/instalacion-aire-acondicionado` |
| Contratar mantención | mantención aire acondicionado, técnico aire acondicionado | `/servicios/mantencion-aire-acondicionado` |
| Resolver necesidad comercial | técnico refrigeración comercial, servicio refrigeración comercial | `/servicios/refrigeracion-comercial` |
| Resolver cámara de frío | técnico cámara de frío, mantención cámara de frío | `/servicios/camaras-de-frio` |
| Comparar profesionales | técnico refrigeración Chile, técnico climatización Chile | `/tecnicos` |
| Informarse | cómo elegir técnico, señales mantención aire acondicionado | `/guias` y sus artículos |

Las variantes por comuna se trabajan inicialmente mediante perfiles reales y
filtros. Solo crear una página indexable por comuna cuando existan al menos tres
perfiles reales publicados, contenido local diferenciable y una respuesta útil
para el visitante. No generar cientos de páginas vacías o casi idénticas.

## Activos implementados en el sitio

- Control de indexación que falla cerrado y solo permite producción real.
- `robots.txt` público con exclusión de áreas privadas.
- sitemap dinámico con páginas editoriales y perfiles reales publicados.
- metadatos canónicos, Open Graph y tarjeta social generada por el sitio.
- datos estructurados para organización, sitio, colecciones, artículos, migas de
  pan y perfiles reales.
- cuatro páginas comerciales de servicio.
- cuatro guías educativas con enlaces de difusión medibles.
- una fila de enlaces internos discreta y legible al final del pie de página;
  la portada y la navegación principal conservan su estructura anterior.
- llamados a buscar perfiles desde cada guía y servicio.

## Canales gratuitos

### 1. Google Search

Canal de mayor intención. Después de la apertura pública:

1. Crear una propiedad de dominio de Google Search Console.
2. Configurar `GOOGLE_SITE_VERIFICATION` si se usa la verificación HTML.
3. Confirmar que `/robots.txt` permite rastreo y que `/sitemap.xml` contiene
   únicamente URLs públicas reales.
4. Enviar `https://redtecnicos.cl/sitemap.xml`.
5. Inspeccionar portada, directorio, las cuatro páginas de servicio y una guía.
6. Revisar semanalmente consultas, páginas, clics, impresiones, CTR y posición.

No crear un Perfil de Negocio de Google para el directorio mientras sea un
negocio exclusivamente en línea o de generación de contactos. La política
actual declara esas categorías como no elegibles:
<https://support.google.com/business/answer/13763036>

Los técnicos o empresas elegibles pueden administrar sus propios perfiles de
negocio y enlazar a su página en Red Técnicos Chile solo si son propietarios o
representantes autorizados y cumplen las políticas de Google.

### 2. Instagram y Facebook

Publicar tres piezas por semana usando material propio, trabajos autorizados o
gráficas de texto. No reutilizar fotografías de perfiles sin consentimiento.

- Lunes: síntoma o error común.
- Miércoles: checklist o plantilla útil.
- Viernes: perfil/territorio de la semana, solo con autorización.

Cada publicación lleva a una sola URL con UTM:

```text
?utm_source=instagram&utm_medium=organic&utm_campaign=encuentra_tecnico&utm_content=tema_formato_semana
```

Ejemplo para Facebook:

> ¿Tu aire acondicionado tiene menos caudal, ruido u olor que antes? Anota
> marca, modelo y síntoma antes de pedir una visita. Preparamos una guía breve
> para saber qué observar y cómo solicitar ayuda sin intervenir el equipo.
> [URL de la guía con UTM]

Ejemplo para Instagram:

> Antes de escribir “no enfría”, reúne 5 datos: equipo, comuna, marca/modelo,
> síntoma y desde cuándo ocurre. Guarda esta lista y úsala al contactar un
> técnico. Guía completa en el enlace del perfil.

### 3. LinkedIn

Publicar dos veces por semana para comercios, facility managers, gastronomía y
pequeñas industrias.

- Martes: continuidad operacional y cómo preparar una solicitud.
- Jueves: aprendizaje de la red, nueva cobertura o guía técnica.

Ejemplo:

> Una solicitud de refrigeración comercial mejora mucho cuando incluye
> temperatura objetivo y actual, alarmas, marca/modelo, comuna y momento de la
> falla. Creamos una plantilla gratuita para ordenar esos datos antes del
> contacto. [URL con UTM]

### 4. WhatsApp de los profesionales

Al aprobar un perfil, enviar un paquete de difusión voluntario:

- URL pública del perfil.
- texto corto para estado de WhatsApp;
- texto para clientes anteriores que ya consintieron comunicaciones;
- imagen social del sitio;
- instrucción expresa de no enviar mensajes masivos ni usar bases compradas.

Texto sugerido:

> Ya puedes revisar mi perfil profesional, servicios y cobertura en Red
> Técnicos Chile: [URL del perfil con UTM]. La plataforma permite registrar una
> solicitud y contactarme directamente.

UTM sugerida:

```text
?utm_source=whatsapp&utm_medium=organic&utm_campaign=perfiles_red&utm_content=slug_del_perfil
```

### 5. Alianzas y enlaces editoriales

Contactar de forma personalizada a institutos, capacitadores, proveedores,
asociaciones y medios sectoriales. La propuesta no es “intercambiar enlaces”,
sino aportar un recurso útil:

- guía para redactar solicitudes técnicas;
- checklist para cámaras de frío;
- directorio voluntario para egresados o técnicos;
- datos agregados de cobertura cuando existan suficientes registros reales.

Meta operativa: cinco contactos personalizados por semana y una colaboración
editorial útil al mes. No comprar enlaces, no automatizar correos y no crear
perfiles de terceros sin autorización.

## Calendario de 12 semanas

| Semana | Publicación principal | Distribución | Operación de red |
| --- | --- | --- | --- |
| 1 | Cómo elegir un técnico | IG, FB, LinkedIn | Invitar primeros perfiles a compartir su URL |
| 2 | Instalación de aire acondicionado | carrusel checklist | Contactar 5 instituciones/capacitadores |
| 3 | Señales de mantención de aire acondicionado | reel/short y post | Recoger preguntas reales recibidas |
| 4 | Mantención de aire acondicionado | caso educativo sin datos personales | Actualizar FAQ con dudas repetidas |
| 5 | Cómo redactar una solicitud técnica | plantilla descargable como carrusel | Enviar paquete de difusión a nuevos perfiles |
| 6 | Refrigeración comercial | post para comercios en LinkedIn | Contactar 5 gremios/proveedores |
| 7 | Señales en una cámara de frío | carrusel operacional | Revisar consultas de Search Console |
| 8 | Técnicos para cámaras de frío | publicación por cobertura real | Optimizar títulos con consultas reales |
| 9 | Cómo comparar dos presupuestos | artículo o ampliación de guía | Solicitar colaboración editorial |
| 10 | Qué significa “información revisada” | transparencia del directorio | Publicar metodología de revisión |
| 11 | Coberturas nuevas de la red | mapa/gráfica con datos agregados | Reactivar perfiles incompletos |
| 12 | Resumen: 4 checklists para guardar | recopilatorio | Evaluar conversiones y planificar trimestre 2 |

En semanas 9 y 10 se publican nuevas guías solo si responden preguntas reales.
Actualizar contenido útil suele ser mejor que aumentar volumen sin evidencia.

## Rutina semanal de 3 horas

- 45 min: revisar Search Console y solicitudes recibidas.
- 45 min: mejorar una página existente con preguntas reales.
- 45 min: preparar tres adaptaciones sociales del mismo contenido.
- 30 min: contactar alianzas o medios sectoriales.
- 15 min: enviar el paquete de difusión a perfiles nuevos.

## Tablero de medición

Registrar cada lunes, sin datos personales:

| Indicador | Fuente | Meta inicial |
| --- | --- | --- |
| Páginas indexadas válidas | Search Console | crecimiento sostenido, sin páginas privadas |
| Impresiones orgánicas | Search Console | tendencia semanal positiva desde la semana 4 |
| Clics orgánicos | Search Console | crecimiento mensual, no una cifra aislada |
| CTR por página/consulta | Search Console | mejorar títulos de alto volumen y bajo CTR |
| Solicitudes válidas | panel administrativo | principal conversión |
| Tasa clic orgánico → solicitud | Search Console + solicitudes | línea base durante el primer mes |
| Perfiles que compartieron su URL | control operativo | 50% de perfiles aprobados |
| Alianzas editoriales | registro manual | una al mes |

No fijar una promesa de posición o volumen antes de obtener la línea base. En un
dominio nuevo, las primeras semanas sirven para rastreo, indexación y aprendizaje;
la evaluación seria debe hacerse por tendencia de 8 a 12 semanas.

## Criterios de optimización

- Muchas impresiones y pocos clics: mejorar título y descripción según la
  consulta real, sin exagerar.
- Visitas y pocas solicitudes: revisar cobertura disponible, claridad del CTA y
  fricción del formulario.
- Solicitudes inválidas: aclarar servicio, ubicación, urgencia y límites de la
  plataforma antes del formulario.
- Una consulta nueva se repite: ampliar una página existente o crear una guía.
- Una comuna alcanza tres o más perfiles reales: evaluar una landing local única
  con datos de cobertura reales.
- Una página no aporta impresiones, enlaces ni conversiones después de un periodo
  razonable: actualizar, consolidar o retirar del sitemap.

## Checklist de apertura orgánica

- [ ] Barreras legales y de seguridad del proyecto aprobadas.
- [ ] Producción usa Supabase real y no muestra perfiles demo.
- [ ] HTTPS y dominio canónico funcionan sin duplicados.
- [ ] `SEO_INDEXING_ENABLED=true` solo en producción autorizada.
- [ ] `/robots.txt` permite páginas públicas y bloquea áreas privadas.
- [ ] `/sitemap.xml` contiene servicios, guías y perfiles reales.
- [ ] Search Console está verificado y recibió el sitemap.
- [ ] Formularios y correos fueron probados de extremo a extremo.
- [ ] Existe al menos una cobertura real útil para la demanda promovida.
- [ ] Cada publicación usa una URL y UTM coherentes.
- [ ] El tablero semanal tiene responsable y fecha de revisión.
