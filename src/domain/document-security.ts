import type { QualificationDocumentMime } from "@/domain/professional-qualification";

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function detectQualificationDocumentMime(buffer: Buffer): QualificationDocumentMime | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).equals(Buffer.from("%PDF-", "ascii"))) {
    return "application/pdf";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= pngSignature.length && buffer.subarray(0, pngSignature.length).equals(pngSignature)) {
    return "image/png";
  }
  return null;
}

export function qualificationDocumentExtension(mime: QualificationDocumentMime): "pdf" | "jpg" | "png" {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/jpeg") return "jpg";
  return "png";
}

export function normalizeOriginalDocumentName(name: string): string {
  const normalized = name
    .normalize("NFKC")
    .replace(/[\\/\u0000-\u001f\u007f]/gu, "-")
    .replace(/\s+/gu, " ")
    .trim();
  return (normalized || "documento").slice(0, 180);
}

export type ClamAvParsedResult =
  | { status: "clean" }
  | { status: "infected"; threat: string }
  | { status: "error"; message: string };

export function parseClamAvResponse(rawResponse: string): ClamAvParsedResult {
  const response = rawResponse.replace(/\0/gu, "").trim();
  if (/:\s+OK$/u.test(response)) return { status: "clean" };
  const infected = response.match(/:\s+(.+?)\s+FOUND$/u);
  if (infected?.[1]) return { status: "infected", threat: infected[1] };
  return { status: "error", message: response || "ClamAV no devolvió una respuesta válida." };
}
