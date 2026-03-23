import { describe, it, expect } from 'vitest'
import { Project } from 'ts-morph'
import { join } from 'path'
import { parseTsxFile } from '../../src/parser/tsx-parser.js'
import { parseSurfaiceTags } from '../../src/jsdoc/surfaice-tags.js'
import { mapActionsToElements } from '../../src/jsdoc/action-mapper.js'
import { generateManifest } from '../../src/generator/manifest-generator.js'
import { validate } from '@surfaice/format'
import type { DiscoveredRoute } from '../../src/types.js'

const FIXTURES = join(new URL('.', import.meta.url).pathname, '../fixtures/cotale')

function makeRoute(): DiscoveredRoute {
  return {
    route: '/dashboard/settings',
    filePath: join(FIXTURES, 'settings-page.tsx'),
    segments: ['dashboard', 'settings'],
    dynamicParams: [],
    isPublic: false,
  }
}

describe('CoTale settings page — full pipeline', () => {
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

  it('route is /dashboard/settings', () => {
    expect(manifest.route).toBe('/dashboard/settings')
  })

  it('has auth-required state', () => {
    expect(manifest.states).toContain('auth-required')
  })

  it('extracts back link', () => {
    const link = page.elements.find(e => e.id === 'back-link')
    expect(link?.type).toBe('link')
    expect(link?.navigatesTo).toBe('/dashboard')
  })

  it('extracts email as disabled + readonly', () => {
    const email = page.elements.find(e => e.id === 'email')
    expect(email?.attributes).toContain('disabled')
    expect(email?.attributes).toContain('readonly')
  })

  it('extracts username input as required', () => {
    const username = page.elements.find(e => e.id === 'username')
    expect(username?.type).toBe('textbox')
    expect(username?.attributes).toContain('required')
  })

  it('extracts bio textarea', () => {
    expect(page.elements.find(e => e.id === 'bio')?.type).toBe('textarea')
  })

  it('extracts save button', () => {
    expect(page.elements.find(e => e.id === 'save')?.type).toBe('button')
  })

  it('detects @surfaice PUT action tag', () => {
    expect(tags.find(t => t.action === 'PUT /api/profile')).toBeDefined()
  })

  it('save button has PUT action wired', () => {
    const allEls = manifest.sections.flatMap(s => s.elements)
    const save = allEls.find(e => e.id === 'save')
    expect(save?.action).toBe('PUT /api/profile')
  })
})
