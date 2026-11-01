export const FALLBACK_NANGO_KEY = "8fd2eccd-4850-4080-ae7f-f48cc3e317af";

export function getNangoKey(): string {
  if (process.env.NANGO_SECRET_KEY && process.env.NANGO_SECRET_KEY.trim()) {
    return process.env.NANGO_SECRET_KEY.trim();
  }
  return FALLBACK_NANGO_KEY;
}

