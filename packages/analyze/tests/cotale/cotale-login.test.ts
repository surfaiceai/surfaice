import { describe, it, expect } from 'vitest'
import { Project } from 'ts-morph'
import { join } from 'path'
import { parseTsxFile } from '../../src/parser/tsx-parser.js'
import { parseSurfaiceTags } from '../../src/jsdoc/surfaice-tags.js'
import { mapActionsToElements } from '../../src/jsdoc/action-mapper.js'
import { generateManifest } from '../../src/generator/manifest-generator.js'
import { serialize, validate } from '@surfaice/format'
import type { DiscoveredRoute } from '../../src/types.js'

const FIXTURES = join(new URL('.', import.meta.url).pathname, '../fixtures/cotale')

function makeRoute(): DiscoveredRoute {
  return {
    route: '/login',
    filePath: join(FIXTURES, 'login-page.tsx'),
    segments: ['login'],
    dynamicParams: [],
    isPublic: true,
  }
}

describe('CoTale login page — full pipeline', () => {
  const project = new Project({ skipAddingFilesFromTsConfig: true })
  const route = makeRoute()
  const page = parseTsxFile(route.filePath, route.route, project)
  const sf = project.getSourceFile(route.filePath)!
  const tags = parseSurfaiceTags(sf)
  const mappedActions = mapActionsToElements(tags, page.elements, sf)
  const manifest = generateManifest({ route, page, tags, mappedActions })

  it('produces a valid SurfaicePage', () => {
    expect(validate(manifest)).toHaveLength(0)
  })

  it('route is /login', () => {
    expect(manifest.route).toBe('/login')
  })

  it('no auth-required state', () => {
    expect(manifest.states ?? []).not.toContain('auth-required')
  })

  it('detects @surfaice action tag', () => {
    expect(tags.length).toBeGreaterThan(0)
    expect(tags[0]?.action).toBe('POST /user/login')
  })

  it('extracts email input', () => {
    const els = page.elements
    expect(els.find(e => e.id === 'email')?.type).toBe('textbox')
  })

  it('extracts password input', () => {
    expect(page.elements.find(e => e.id === 'password')?.type).toBe('textbox')
  })

  it('extracts submit button', () => {
    expect(page.elements.find(e => e.id === 'submit')?.type).toBe('button')
  })

  it('extracts register link', () => {
    const link = page.elements.find(e => e.id === 'register-link')
    expect(link?.type).toBe('link')
    expect(link?.navigatesTo).toBe('/register')
  })

  it('email label resolved via htmlFor', () => {
    const email = page.elements.find(e => e.id === 'email')
    expect(email?.label).toBeTruthy()
  })

  it('submit button has action wired', () => {
    const allEls = manifest.sections.flatMap(s => s.elements)
    const submit = allEls.find(e => e.id === 'submit')
    expect(submit?.action).toBe('POST /user/login')
  })

  it('submit button result has navigates to /dashboard', () => {
    const allEls = manifest.sections.flatMap(s => s.elements)
    const submit = allEls.find(e => e.id === 'submit')
    expect(submit?.result).toContain('/dashboard')
  })

  it('serializes to non-empty markdown', () => {
    const md = serialize(manifest)
    expect(md).toContain('route: /login')
    expect(md).toContain('surfaice: v1')
  })
})
