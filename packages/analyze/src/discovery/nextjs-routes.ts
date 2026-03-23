import { globSync } from 'glob'
import { resolve, dirname, join } from 'path'
import type { DiscoveredRoute, DiscoveryOptions } from '../types.js'

/**
 * Discover Next.js App Router routes from the file system.
 * Walks the app directory and converts page.{tsx,ts,jsx,js} paths to route strings.
 */
export function discoverRoutes(options: DiscoveryOptions): DiscoveredRoute[] {
  const { appDir, stripLocale = true, exclude = ['api'] } = options

  // Find all page files (App Router convention)
  const pageFiles = globSync('**/page.{tsx,ts,jsx,js}', {
    cwd: appDir,
    posix: true,
  })

  const routes: DiscoveredRoute[] = pageFiles
    .map((file: string): DiscoveredRoute | null => {
      // Get directory containing the page file (relative to appDir)
      const dir = dirname(file)
      // Split into segments, filtering out the trailing '.'
      const rawSegments: string[] = dir === '.' ? [] : dir.split('/')

      // Apply locale stripping: remove literal '[locale]' segment
      const segments: string[] = stripLocale
        ? rawSegments.filter((s: string) => s !== '[locale]')
        : rawSegments

      // Check exclusions against the first meaningful segment
      const firstSegment = segments[0] ?? ''
      if (exclude.some((e: string) => firstSegment === e)) return null

      // Extract dynamic param names: [id] → id
      const dynamicParams: string[] = segments
        .filter((s: string) => isDynamic(s))
        .map((s: string) => s.slice(1, -1)) // strip [ ]

      // Build route string: segments → /login, /novels/:id, etc.
      const routeSegments: string[] = segments.map((s: string) =>
        isDynamic(s) ? `:${s.slice(1, -1)}` : s
      )
      const route = routeSegments.length === 0 ? '/' : `/${routeSegments.join('/')}`

      return {
        route,
        filePath: resolve(join(appDir, file)),
        segments,
        dynamicParams,
        isPublic: true, // refined later in Stage 2 (auth guard detection)
      }
    })
    .filter((r): r is DiscoveredRoute => r !== null)

  // Sort routes alphabetically for deterministic output
  routes.sort((a, b) => a.route.localeCompare(b.route))

  return routes
}

function isDynamic(segment: string): boolean {
  return segment.startsWith('[') && segment.endsWith(']')
}
