import { describe, it, expect } from 'vitest'
import { serialize, validate } from '@surfaice/format'
import { generateManifest } from '../../src/generator/manifest-generator.js'
import type { DiscoveredRoute, ParsedPage, ExtractedElement, MappedAction, SurfaiceTag } from '../../src/types.js'

function makeRoute(route: string): DiscoveredRoute {
  return { route, filePath: `/app${route}/page.tsx`, segments: route.split('/').filter(Boolean), dynamicParams: [], isPublic: true }
}

function makeElement(overrides: Partial<ExtractedElement> & Pick<ExtractedElement, 'id' | 'type'>): ExtractedElement {
  return {
    label: overrides.id,
    attributes: [],
    jsxTag: 'input',
    sourceLocation: { line: 1, column: 0 },
    ...overrides,
  }
}

// ─── Basic generation ─────────────────────────────────────────────────────────
describe('generateManifest — login page', () => {
  const route = makeRoute('/login')
  const elements: ExtractedElement[] = [
    makeElement({ id: 'email', type: 'textbox', label: 'email', inputType: 'email', attributes: ['required'], containingForm: 'login-form' }),
    makeElement({ id: 'password', type: 'textbox', label: 'password', inputType: 'password', attributes: ['required'], containingForm: 'login-form' }),
    makeElement({ id: 'submit', type: 'button', label: 'signIn', jsxTag: 'button', containingForm: 'login-form' }),
    makeElement({ id: 'register-link', type: 'link', label: 'signUp', jsxTag: 'Link', navigatesTo: '/register' }),
  ]
  const page: ParsedPage = {
    route: '/login', filePath: '/app/login/page.tsx', elements, imports: [],
    hasAuthGuard: false, componentName: 'LoginPage',
  }
  const tags: SurfaiceTag[] = []
  const mappedActions: MappedAction[] = [
    { elementId: 'submit', action: 'POST /user/login', fields: ['email', 'password'], result: 'navigates: /dashboard' },
  ]

  it('produces a valid SurfaicePage', () => {
    const manifest = generateManifest({ route, page, tags, mappedActions })
    const errors = validate(manifest)
    expect(errors).toHaveLength(0)
  })

  it('route is set correctly', () => {
    const manifest = generateManifest({ route, page, tags, mappedActions })
    expect(manifest.route).toBe('/login')
  })

  it('no auth-required state on public page', () => {
    const manifest = generateManifest({ route, page, tags, mappedActions })
    expect(manifest.states ?? []).not.toContain('auth-required')
  })

  it('submit button has action wired', () => {
    const manifest = generateManifest({ route, page, tags, mappedActions })
    const allElements = manifest.sections.flatMap(s => s.elements)
    const submitEl = allElements.find(e => e.id === 'submit')
    expect(submitEl?.action).toBe('POST /user/login')
    expect(submitEl?.result).toBe('navigates: /dashboard')
  })

  it('email input has accepts: email', () => {
    const manifest = generateManifest({ route, page, tags, mappedActions })
    const allElements = manifest.sections.flatMap(s => s.elements)
    const emailEl = allElements.find(e => e.id === 'email')
    expect(emailEl?.accepts).toBe('email')
  })

  it('link has navigates set', () => {
    const manifest = generateManifest({ route, page, tags, mappedActions })
    const allElements = manifest.sections.flatMap(s => s.elements)
    const link = allElements.find(e => e.id === 'register-link')
    expect(link?.navigates).toBe('/register')
  })

  it('form elements grouped into a section', () => {
    const manifest = generateManifest({ route, page, tags, mappedActions })
    const formSection = manifest.sections.find(s =>
      s.elements.some(e => e.id === 'email')
    )
    expect(formSection).toBeDefined()
  })

  it('navigation links in separate section', () => {
    const manifest = generateManifest({ route, page, tags, mappedActions })
    const navSection = manifest.sections.find(s => s.name === 'Navigation')
    expect(navSection).toBeDefined()
    expect(navSection?.elements.some(e => e.id === 'register-link')).toBe(true)
  })

  it('serialize produces non-empty markdown', () => {
    const manifest = generateManifest({ route, page, tags, mappedActions })
    const md = serialize(manifest)
    expect(md).toContain('surfaice')
    expect(md).toContain('/login')
  })
})

// ─── Auth-guarded page ────────────────────────────────────────────────────────
describe('generateManifest — auth-guarded page', () => {
  const route = makeRoute('/dashboard')
  const page: ParsedPage = {
    route: '/dashboard', filePath: '/app/dashboard/page.tsx',
    elements: [makeElement({ id: 'new-novel', type: 'button', label: 'New Novel', jsxTag: 'button' })],
    imports: [], hasAuthGuard: true, componentName: 'DashboardPage',
  }

  it('sets auth-required state', () => {
    const manifest = generateManifest({ route, page, tags: [], mappedActions: [] })
    expect(manifest.states).toContain('auth-required')
  })
})

// ─── Anonymous form (no id) ────────────────────────────────────────────────────
describe('generateManifest — anonymous form', () => {
  const route = makeRoute('/settings')
  const elements: ExtractedElement[] = [
    makeElement({ id: 'username', type: 'textbox', label: 'username', containingForm: '__form_handleUpdate' }),
    makeElement({ id: 'bio', type: 'textarea', label: 'bio', jsxTag: 'textarea', containingForm: '__form_handleUpdate' }),
    makeElement({ id: 'save', type: 'button', label: 'save', jsxTag: 'button', containingForm: '__form_handleUpdate' }),
  ]
  const page: ParsedPage = {
    route: '/settings', filePath: '/app/settings/page.tsx',
    elements, imports: [], hasAuthGuard: true, componentName: 'SettingsPage',
  }

  it('groups anonymous form elements into a section', () => {
    const manifest = generateManifest({ route, page, tags: [], mappedActions: [] })
    const section = manifest.sections.find(s => s.elements.some(e => e.id === 'username'))
    expect(section).toBeDefined()
    expect(section?.elements.length).toBeGreaterThanOrEqual(2)
  })
})
