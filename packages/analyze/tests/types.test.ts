import { describe, it, expect } from 'vitest'
import type {
  DiscoveredRoute,
  ExtractedElement,
  ParsedPage,
  SurfaiceTag,
  MappedAction,
  AnalyzeOptions,
  AnalyzeResult,
} from '../src/index.js'

describe('types', () => {
  it('DiscoveredRoute shape', () => {
    const r: DiscoveredRoute = {
      route: '/login',
      filePath: '/app/login/page.tsx',
      segments: ['login'],
      dynamicParams: [],
      isPublic: true,
    }
    expect(r.route).toBe('/login')
    expect(r.dynamicParams).toHaveLength(0)
  })

  it('ExtractedElement shape', () => {
    const el: ExtractedElement = {
      id: 'email-input',
      type: 'textbox',
      label: 'email',
      attributes: ['required'],
      inputType: 'email',
      jsxTag: 'input',
      sourceLocation: { line: 10, column: 4 },
    }
    expect(el.type).toBe('textbox')
    expect(el.attributes).toContain('required')
  })

  it('ParsedPage shape', () => {
    const page: ParsedPage = {
      route: '/login',
      filePath: '/app/login/page.tsx',
      elements: [],
      imports: ['react'],
      hasAuthGuard: false,
      componentName: 'LoginPage',
    }
    expect(page.hasAuthGuard).toBe(false)
  })

  it('SurfaiceTag shape — action', () => {
    const tag: SurfaiceTag = {
      kind: 'action',
      action: 'POST /user/login',
      fields: ['email', 'password'],
      returns: 'access_token',
    }
    expect(tag.kind).toBe('action')
    expect(tag.fields).toHaveLength(2)
  })

  it('SurfaiceTag shape — auth', () => {
    const tag: SurfaiceTag = {
      kind: 'auth',
      login: 'POST /user/login',
      token: { from: 'body', path: 'data.access_token' },
      use: 'Authorization: Bearer {token}',
    }
    expect(tag.kind).toBe('auth')
  })

  it('MappedAction shape', () => {
    const action: MappedAction = {
      elementId: 'submit-btn',
      action: 'POST /user/login',
      fields: ['email', 'password'],
      result: 'navigates: /dashboard',
    }
    expect(action.elementId).toBe('submit-btn')
  })

  it('AnalyzeOptions shape', () => {
    const opts: AnalyzeOptions = {
      appDir: '/app',
      outDir: 'surfaice/',
      stripLocale: true,
      exclude: ['api'],
      dryRun: false,
    }
    expect(opts.appDir).toBe('/app')
  })

  it('AnalyzeResult shape', () => {
    const result: AnalyzeResult = {
      pages: [],
      totalRoutes: 0,
      totalElements: 0,
      warnings: [],
    }
    expect(result.totalRoutes).toBe(0)
  })
})
