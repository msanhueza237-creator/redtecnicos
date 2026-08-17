const DEFAULT_PUBLIC_SITE_ORIGIN = "https://redtecnicos.cl";
const INTERNAL_BIND_HOSTS = new Set(["0.0.0.0", "::", "[::]"]);

function normalizePublicOrigin(candidate: string | undefined): string | null {
  const value = candidate?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (INTERNAL_BIND_HOSTS.has(url.hostname)) return null;
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getPublicSiteOrigin(): string {
  return normalizePublicOrigin(process.env.APP_URL)
    ?? normalizePublicOrigin(process.env.NEXT_PUBLIC_APP_URL)
    ?? DEFAULT_PUBLIC_SITE_ORIGIN;
}

export function publicSiteUrl(pathname: string): string {
  return new URL(pathname, `${getPublicSiteOrigin()}/`).toString();
}
