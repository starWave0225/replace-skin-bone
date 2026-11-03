/** Resolve runtime-loaded public assets for root and project-subdirectory hosting. */
export function assetUrl(path: string, base = import.meta.env?.BASE_URL ?? '/'): string {
  if (!path.startsWith('/assets/')) return path
  return `${base.replace(/\/?$/, '/')}${path.slice(1)}`
}
