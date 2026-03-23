import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { discoverRoutes } from '../../src/discovery/nextjs-routes.js'

// Create a temp app directory mimicking CoTale's layout
function makeAppDir(): string {
  const dir = join(tmpdir(), `surfaice-test-${Date.now()}`)
  const pages = [
    '[locale]/page.tsx',
    '[locale]/login/page.tsx',
    '[locale]/register/page.tsx',
    '[locale]/dashboard/page.tsx',
    '[locale]/dashboard/settings/page.tsx',
    '[locale]/dashboard/agents/page.tsx',
    '[locale]/dashboard/new/page.tsx',
    '[locale]/dashboard/llm/page.tsx',
    '[locale]/novels/page.tsx',
    '[locale]/novels/[id]/page.tsx',
    '[locale]/novels/[id]/read/[chapterId]/page.tsx',
    '[locale]/novels/[id]/write/page.tsx',
    '[locale]/writers/[id]/page.tsx',
    '[locale]/verify-email/page.tsx',
    '[locale]/privacy/page.tsx',
    '[locale]/terms/page.tsx',
    '[locale]/admin/dashboard/page.tsx',
    'api/auth/route.ts',
    'api/novels/route.ts',
  ]
  for (const p of pages) {
    const full = join(dir, p)
    mkdirSync(full.replace(/\/[^/]+$/, ''), { recursive: true })
    writeFileSync(full, '// placeholder')
  }
  return dir
}

let appDir: string

beforeEach(() => {
  appDir = makeAppDir()
})

afterEach(() => {
  rmSync(appDir, { recursive: true, force: true })
})

describe('discoverRoutes', () => {
  it('finds all page files and excludes api routes', () => {
    const routes = discoverRoutes({ appDir })
    const routePaths = routes.map(r => r.route)
    expect(routePaths).not.toContain('/api/auth')
    expect(routePaths).not.toContain('/api/novels')
    expect(routePaths.length).toBeGreaterThan(0)
  })

  it('discovers root route from [locale]/page.tsx', () => {
    const routes = discoverRoutes({ appDir })
    const root = routes.find(r => r.route === '/')
    expect(root).toBeDefined()
  })

  it('strips [locale] by default', () => {
    const routes = discoverRoutes({ appDir })
    const routePaths = routes.map(r => r.route)
    // No route should include [locale] or :locale
    expect(routePaths.every(r => !r.includes('[locale]'))).toBe(true)
    expect(routePaths.every(r => !r.includes(':locale'))).toBe(true)
  })

  it('keeps [locale] when stripLocale: false', () => {
    const routes = discoverRoutes({ appDir, stripLocale: false })
    const routePaths = routes.map(r => r.route)
    expect(routePaths.some(r => r.includes(':locale'))).toBe(true)
  })

  it('discovers /login route', () => {
    const routes = discoverRoutes({ appDir })
    expect(routes.map(r => r.route)).toContain('/login')
  })

  it('discovers nested /dashboard/settings', () => {
    const routes = discoverRoutes({ appDir })
    expect(routes.map(r => r.route)).toContain('/dashboard/settings')
  })

  it('converts [id] to :id in route string', () => {
    const routes = discoverRoutes({ appDir })
    expect(routes.map(r => r.route)).toContain('/novels/:id')
  })

  it('handles deeply nested dynamic route /novels/:id/read/:chapterId', () => {
    const routes = discoverRoutes({ appDir })
    expect(routes.map(r => r.route)).toContain('/novels/:id/read/:chapterId')
  })

  it('extracts dynamicParams correctly', () => {
    const routes = discoverRoutes({ appDir })
    const novelById = routes.find(r => r.route === '/novels/:id')
    expect(novelById?.dynamicParams).toEqual(['id'])

    const readChapter = routes.find(r => r.route === '/novels/:id/read/:chapterId')
    expect(readChapter?.dynamicParams).toContain('id')
    expect(readChapter?.dynamicParams).toContain('chapterId')
  })

  it('returns sorted routes', () => {
    const routes = discoverRoutes({ appDir })
    const routePaths = routes.map(r => r.route)
    const sorted = [...routePaths].sort()
    expect(routePaths).toEqual(sorted)
  })

  it('sets filePath to absolute path', () => {
    const routes = discoverRoutes({ appDir })
    for (const r of routes) {
      expect(r.filePath.startsWith('/')).toBe(true)
    }
  })

  it('custom exclude skips matching first segment', () => {
    const routes = discoverRoutes({ appDir, exclude: ['admin'] })
    expect(routes.map(r => r.route)).not.toContain('/admin/dashboard')
  })

  it('discovers all expected CoTale-like routes', () => {
    const routes = discoverRoutes({ appDir })
    const routePaths = routes.map(r => r.route)
    const expected = [
      '/',
      '/login',
      '/register',
      '/dashboard',
      '/dashboard/settings',
      '/dashboard/agents',
      '/dashboard/new',
      '/dashboard/llm',
      '/novels',
      '/novels/:id',
      '/novels/:id/read/:chapterId',
      '/novels/:id/write',
      '/writers/:id',
      '/verify-email',
      '/privacy',
      '/terms',
      '/admin/dashboard',
    ]
    for (const e of expected) {
      expect(routePaths).toContain(e)
    }
  })
})
