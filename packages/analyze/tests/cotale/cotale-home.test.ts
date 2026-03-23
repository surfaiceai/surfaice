import { describe, it, expect } from 'vitest'
import { Project } from 'ts-morph'
import { join } from 'path'
import { parseTsxFile } from '../../src/parser/tsx-parser.js'
import { generateManifest } from '../../src/generator/manifest-generator.js'
import { validate } from '@surfaice/format'
import type { DiscoveredRoute } from '../../src/types.js'

const FIXTURES = join(new URL('.', import.meta.url).pathname, '../fixtures/cotale')

describe('CoTale home page — full pipeline', () => {
  const project = new Project({ skipAddingFilesFromTsConfig: true })
  const route: DiscoveredRoute = {
    route: '/',
    filePath: join(FIXTURES, 'home-page.tsx'),
    segments: [],
    dynamicParams: [],
    isPublic: true,
  }
  const page = parseTsxFile(route.filePath, route.route, project)
  const manifest = generateManifest({ route, page, tags: [], mappedActions: [] })

  it('produces a valid SurfaicePage', () => {
    expect(validate(manifest)).toHaveLength(0)
  })

  it('route is /', () => {
    expect(manifest.route).toBe('/')
  })

  it('no auth-required', () => {
    expect(manifest.states ?? []).not.toContain('auth-required')
  })

  it('has navigation links', () => {
    const allEls = manifest.sections.flatMap(s => s.elements)
    const links = allEls.filter(e => e.type === 'link')
    expect(links.length).toBeGreaterThanOrEqual(2)
  })

  it('explore link navigates to /novels', () => {
    const allEls = manifest.sections.flatMap(s => s.elements)
    expect(allEls.find(e => e.id === 'explore-link')?.navigates).toBe('/novels')
  })

  it('register link navigates to /register', () => {
    const allEls = manifest.sections.flatMap(s => s.elements)
    expect(allEls.find(e => e.id === 'register-link')?.navigates).toBe('/register')
  })

  it('no form elements on home page', () => {
    const allEls = manifest.sections.flatMap(s => s.elements)
    expect(allEls.filter(e => e.type === 'textbox').length).toBe(0)
  })
})
