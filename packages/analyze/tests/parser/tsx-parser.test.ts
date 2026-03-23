import { describe, it, expect } from 'vitest'
import { Project } from 'ts-morph'
import { join } from 'path'
import { parseTsxFile } from '../../src/parser/tsx-parser.js'

const FIXTURES = join(new URL('.', import.meta.url).pathname, '../fixtures')

function makeProject() {
  return new Project({ useInMemoryFileSystem: false, skipAddingFilesFromTsConfig: true })
}

describe('parseTsxFile', () => {
  it('returns route and filePath', () => {
    const project = makeProject()
    const filePath = join(FIXTURES, 'simple-form.tsx')
    const page = parseTsxFile(filePath, '/login', project)
    expect(page.route).toBe('/login')
    expect(page.filePath).toBe(filePath)
  })

  it('detects default export component name', () => {
    const project = makeProject()
    const page = parseTsxFile(join(FIXTURES, 'simple-form.tsx'), '/login', project)
    expect(page.componentName).toBe('LoginPage')
  })

  it('collects imports', () => {
    const project = makeProject()
    const page = parseTsxFile(join(FIXTURES, 'simple-form.tsx'), '/login', project)
    expect(page.imports.some(i => i.includes('react'))).toBe(true)
  })

  it('detects auth guard on guarded page', () => {
    const project = makeProject()
    const page = parseTsxFile(join(FIXTURES, 'auth-guarded.tsx'), '/dashboard', project)
    expect(page.hasAuthGuard).toBe(true)
  })

  it('does NOT detect auth guard on public page', () => {
    const project = makeProject()
    const page = parseTsxFile(join(FIXTURES, 'simple-form.tsx'), '/login', project)
    expect(page.hasAuthGuard).toBe(false)
  })

  it('returns non-empty elements array for form page', () => {
    const project = makeProject()
    const page = parseTsxFile(join(FIXTURES, 'simple-form.tsx'), '/login', project)
    expect(page.elements.length).toBeGreaterThan(0)
  })
})
