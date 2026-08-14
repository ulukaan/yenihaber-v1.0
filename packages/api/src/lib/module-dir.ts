import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Webpack `new URL(".", import.meta.url)` ifadesini modül sanır. */
export function dirFromImportMeta(metaUrl: string): string {
  return dirname(fileURLToPath(metaUrl));
}

export function resolveFromImportMeta(
  metaUrl: string,
  ...segments: string[]
): string {
  return resolve(dirFromImportMeta(metaUrl), ...segments);
}
