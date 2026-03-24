/**
 * Bundles `editions/YYYY-MM-DD.json` at build time (Vite). Used when there is no `/api/cast`
 * or as a fallback when the request fails.
 */
const modules = import.meta.glob("../../editions/*.json", { eager: true });

export function getAuthoredEditionSync(dateKey) {
  for (const [p, mod] of Object.entries(modules)) {
    const norm = p.replace(/\\/g, "/");
    if (norm.endsWith(`/${dateKey}.json`)) {
      return mod?.default ?? mod;
    }
  }
  return null;
}
