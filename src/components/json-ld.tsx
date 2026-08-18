import { serializeJsonLd } from "@/lib/seo";

export function JsonLd({ data }: Readonly<{ data: unknown }>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
