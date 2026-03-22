import type { SurfaiceMiddlewareConfig } from './middleware.js'

// Minimal NextConfig type — avoids requiring next as a dep at build time
interface NextConfig {
  env?: Record<string, string>
  [key: string]: unknown
}

/**
 * withSurfaice — Next.js config plugin.
 * Wrap your next.config.ts with this to inject Surfaice env vars.
 *
 * @example
 * // next.config.ts
 * import { withSurfaice } from '@surfaice/next'
 * export default withSurfaice({ enabled: true })({ reactStrictMode: true })
 */
export function withSurfaice(config: SurfaiceMiddlewareConfig = {}) {
  return (nextConfig: NextConfig = {}): NextConfig => {
    return {
      ...nextConfig,
      env: {
        ...nextConfig.env,
        SURFAICE_ENABLED: config.enabled !== false ? 'true' : 'false',
      },
    }
  }
}
