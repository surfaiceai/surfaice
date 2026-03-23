import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { analyze } from '../../src/analyzer.js'

const FIXTURES = join(new URL('.', import.meta.url).pathname, '../fixtures/cotale')

// Create a fake Next.js app directory pointing at our CoTale fixtures
function makeCoTaleAppDir(): { appDir: string; outDir: string; cleanup: () => void } {
  const base = join(tmpdir(), `surfaice-cotale-${Date.now()}`)
  const appDir = join(base, 'app')
  const outDir = join(base, 'out')

  const pages: Record<string, string> = {
    '[locale]/page.tsx': `
      import { Link } from '@/i18n/navigation'
      export default function HomePage() {
        return (
          <div>
            <Link href="/novels" id="explore-link">exploreStories</Link>
            <Link href="/register" id="register-link">signUp</Link>
            <Link href="/dashboard/agents" id="deploy-link">deployAgent</Link>
          </div>
        )
      }
    `,
    '[locale]/login/page.tsx': `
      'use client'
      /** @surfaice action: POST /user/login, fields: [email, password] */
      const handleSubmit = async (e: any) => { e.preventDefault() }
      export default function LoginPage() {
        return (
          <form id="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required />
            <button type="submit" id="submit">Sign In</button>
          </form>
        )
      }
    `,
    '[locale]/dashboard/page.tsx': `
      'use client'
      import { useEffect } from 'react'
      import { useAuth } from '@/hooks/useAuth'
      export default function DashboardPage() {
        const { user, loading } = useAuth()
        const router = { push: (p: string) => {} }
        useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading])
        return <div><a href="/dashboard/settings" id="settings-link">Settings</a></div>
      }
    `,
    '[locale]/dashboard/settings/page.tsx': `
      'use client'
      import { useEffect } from 'react'
      import { useAuth } from '@/hooks/useAuth'
      /** @surfaice action: PUT /api/profile, fields: [username, bio] */
      const handleUpdate = async (e: any) => { e.preventDefault() }
      export default function SettingsPage() {
        const { user, loading } = useAuth()
        const router = { push: (p: string) => {} }
        useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading])
        return (
          <form id="profile-form" onSubmit={handleUpdate}>
            <input id="email" type="email" disabled readOnly value="" />
            <input id="username" type="text" required />
            <textarea id="bio" />
            <button type="submit" id="save">Save</button>
          </form>
        )
      }
    `,
    'api/auth/route.ts': `export async function POST() { return new Response('ok') }`,
  }

  for (const [path, content] of Object.entries(pages)) {
    const full = join(appDir, path)
    mkdirSync(full.replace(/\/[^/]+$/, ''), { recursive: true })
    writeFileSync(full, content)
  }
  mkdirSync(outDir, { recursive: true })

  return { appDir, outDir, cleanup: () => rmSync(base, { recursive: true, force: true }) }
}

describe('CoTale full pipeline — all pages', () => {
  let env: ReturnType<typeof makeCoTaleAppDir>
  let result: Awaited<ReturnType<typeof analyze>>

  beforeAll(async () => {
    env = makeCoTaleAppDir()
    result = await analyze({ appDir: env.appDir, outDir: env.outDir })
  })

  afterAll(() => env.cleanup())

  it('analyzes 4 routes (excluding api)', () => {
    expect(result.totalRoutes).toBe(4)
  })

  it('all routes discovered', () => {
    const routes = result.pages.map(p => p.route).sort()
    expect(routes).toContain('/')
    expect(routes).toContain('/login')
    expect(routes).toContain('/dashboard')
    expect(routes).toContain('/dashboard/settings')
  })

  it('api routes excluded', () => {
    expect(result.pages.map(p => p.route).every(r => !r.startsWith('/api'))).toBe(true)
  })

  it('totalElements > 0', () => {
    expect(result.totalElements).toBeGreaterThan(0)
  })

  it('login page has elements', () => {
    const login = result.pages.find(p => p.route === '/login')
    expect(login?.elementCount).toBeGreaterThan(0)
  })

  it('settings page is auth-required', () => {
    const settings = result.pages.find(p => p.route === '/dashboard/settings')
    expect(settings?.manifest.states).toContain('auth-required')
  })

  it('login page has POST action wired', () => {
    const login = result.pages.find(p => p.route === '/login')
    const allEls = login?.manifest.sections.flatMap(s => s.elements) ?? []
    expect(allEls.some(e => e.action === 'POST /user/login')).toBe(true)
  })

  it('settings page has PUT action wired', () => {
    const settings = result.pages.find(p => p.route === '/dashboard/settings')
    const allEls = settings?.manifest.sections.flatMap(s => s.elements) ?? []
    expect(allEls.some(e => e.action === 'PUT /api/profile')).toBe(true)
  })

  it('writes .surfaice.md files to outDir', () => {
    expect(existsSync(join(env.outDir, 'index.surfaice.md'))).toBe(true)
    expect(existsSync(join(env.outDir, 'login.surfaice.md'))).toBe(true)
    expect(existsSync(join(env.outDir, 'dashboard.surfaice.md'))).toBe(true)
    expect(existsSync(join(env.outDir, 'dashboard-settings.surfaice.md'))).toBe(true)
  })

  it('each page markdown is valid surfaice format', () => {
    for (const page of result.pages) {
      expect(page.markdown).toContain('surfaice: v1')
      expect(page.markdown).toContain(`route: ${page.route}`)
    }
  })
})
