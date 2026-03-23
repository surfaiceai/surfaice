import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { analyze } from '../../src/analyzer.js'

function makeAppDir(): { appDir: string; outDir: string; cleanup: () => void } {
  const base = join(tmpdir(), `surfaice-analyzer-test-${Date.now()}`)
  const appDir = join(base, 'app')
  const outDir = join(base, 'surfaice')

  // Create a minimal Next.js-style app directory
  const pages: Record<string, string> = {
    '[locale]/page.tsx': `
      export default function HomePage() {
        return (
          <div>
            <h1>Home</h1>
            <a href="/login" id="login-link">Sign In</a>
          </div>
        )
      }
    `,
    '[locale]/login/page.tsx': `
      'use client'
      /** @surfaice action: POST /user/login, fields: [email, password] */
      async function handleSubmit(e: any) { e.preventDefault() }

      export default function LoginPage() {
        return (
          <form id="login-form" onSubmit={handleSubmit}>
            <input id="email" type="email" required />
            <input id="password" type="password" required />
            <button type="submit" id="submit">Sign In</button>
          </form>
        )
      }
    `,
    'api/route.ts': `export async function GET() { return new Response('ok') }`,
  }

  for (const [path, content] of Object.entries(pages)) {
    const full = join(appDir, path)
    mkdirSync(full.replace(/\/[^/]+$/, ''), { recursive: true })
    writeFileSync(full, content)
  }

  mkdirSync(outDir, { recursive: true })

  return {
    appDir,
    outDir,
    cleanup: () => rmSync(base, { recursive: true, force: true }),
  }
}

describe('analyze()', () => {
  let env: ReturnType<typeof makeAppDir>

  beforeEach(() => { env = makeAppDir() })
  afterEach(() => env.cleanup())

  it('returns results with totalRoutes > 0', async () => {
    const result = await analyze({ appDir: env.appDir })
    expect(result.totalRoutes).toBeGreaterThan(0)
  })

  it('excludes api routes by default', async () => {
    const result = await analyze({ appDir: env.appDir })
    const routes = result.pages.map(p => p.route)
    expect(routes.every(r => !r.startsWith('/api'))).toBe(true)
  })

  it('discovers root route', async () => {
    const result = await analyze({ appDir: env.appDir })
    expect(result.pages.map(p => p.route)).toContain('/')
  })

  it('discovers /login route', async () => {
    const result = await analyze({ appDir: env.appDir })
    expect(result.pages.map(p => p.route)).toContain('/login')
  })

  it('each page result has markdown', async () => {
    const result = await analyze({ appDir: env.appDir })
    for (const page of result.pages) {
      expect(page.markdown).toContain('surfaice')
    }
  })

  it('dry-run: does not write files', async () => {
    await analyze({ appDir: env.appDir, outDir: env.outDir, dryRun: true })
    const files = existsSync(env.outDir)
      ? require('fs').readdirSync(env.outDir).filter((f: string) => f.endsWith('.surfaice.md'))
      : []
    expect(files).toHaveLength(0)
  })

  it('writes .surfaice.md files when outDir provided', async () => {
    await analyze({ appDir: env.appDir, outDir: env.outDir })
    const indexFile = join(env.outDir, 'index.surfaice.md')
    const loginFile = join(env.outDir, 'login.surfaice.md')
    expect(existsSync(indexFile)).toBe(true)
    expect(existsSync(loginFile)).toBe(true)
  })

  it('written file contains route', async () => {
    await analyze({ appDir: env.appDir, outDir: env.outDir })
    const content = readFileSync(join(env.outDir, 'login.surfaice.md'), 'utf-8')
    expect(content).toContain('route: /login')
  })

  it('totalElements is sum of all page elements', async () => {
    const result = await analyze({ appDir: env.appDir })
    const sum = result.pages.reduce((n, p) => n + p.elementCount, 0)
    expect(result.totalElements).toBe(sum)
  })

  it('routes filter option limits pages analyzed', async () => {
    const result = await analyze({ appDir: env.appDir, routes: ['/login'] })
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0]?.route).toBe('/login')
  })

  it('manifest is defined on each page result', async () => {
    const result = await analyze({ appDir: env.appDir })
    for (const page of result.pages) {
      expect(page.manifest).toBeDefined()
      expect(page.manifest.sections).toBeDefined()
    }
  })
})
