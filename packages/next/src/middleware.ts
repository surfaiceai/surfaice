/**
 * Core middleware logic for Surfaice — framework-agnostic.
 *
 * The actual Next.js middleware wiring is in middleware-next.ts to avoid
 * importing next/server in tests (which have no Next.js runtime).
 */

export interface SurfaiceMiddlewareConfig {
  /** Master toggle. Default: true */
  enabled?: boolean
  /** Only serve Surfaice on these route prefixes */
  include?: string[]
  /** Never serve Surfaice on these route prefixes */
  exclude?: string[]
  /** Auth gate — return false to respond 401 */
  auth?: (headers: Record<string, string | undefined>) => boolean | Promise<boolean>
}

/**
 * Check if the Accept header requests text/surfaice.
 */
export function shouldHandleSurfaice(accept: string | undefined): boolean {
  if (!accept) return false
  return accept.includes('text/surfaice')
}

/**
 * Check if a route is allowed to serve Surfaice responses.
 */
export function isRouteAllowed(
  pathname: string,
  config: Pick<SurfaiceMiddlewareConfig, 'enabled' | 'include' | 'exclude'>,
): boolean {
  // Master toggle
  if (config.enabled === false) return false

  // Exclude takes priority
  if (config.exclude?.some(prefix => pathname.startsWith(prefix))) return false

  // Include filter (prefix match)
  if (config.include) {
    return config.include.some(prefix => pathname.startsWith(prefix))
  }

  return true
}
