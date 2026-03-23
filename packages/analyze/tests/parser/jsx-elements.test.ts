import { describe, it, expect } from 'vitest'
import { Project } from 'ts-morph'
import { join } from 'path'
import { parseTsxFile } from '../../src/parser/tsx-parser.js'

const FIXTURES = join(new URL('.', import.meta.url).pathname, '../fixtures')

describe('JSX element extraction — simple form', () => {
  function getElements() {
    const project = new Project({ skipAddingFilesFromTsConfig: true })
    return parseTsxFile(join(FIXTURES, 'simple-form.tsx'), '/login', project).elements
  }

  it('extracts email input as textbox', () => {
    const els = getElements()
    const email = els.find(e => e.id === 'email')
    expect(email).toBeDefined()
    expect(email?.type).toBe('textbox')
    expect(email?.inputType).toBe('email')
  })

  it('extracts password input as textbox', () => {
    const els = getElements()
    const pw = els.find(e => e.id === 'password')
    expect(pw?.type).toBe('textbox')
    expect(pw?.inputType).toBe('password')
  })

  it('marks required inputs with required attribute', () => {
    const els = getElements()
    const email = els.find(e => e.id === 'email')
    expect(email?.attributes).toContain('required')
  })

  it('extracts submit button', () => {
    const els = getElements()
    const btn = els.find(e => e.type === 'button')
    expect(btn).toBeDefined()
  })

  it('tracks source location', () => {
    const els = getElements()
    expect(els[0]?.sourceLocation.line).toBeGreaterThan(0)
  })

  it('assigns containingForm for elements inside a form', () => {
    const els = getElements()
    const formChildren = els.filter(e => e.containingForm)
    expect(formChildren.length).toBeGreaterThan(0)
    expect(formChildren[0]?.containingForm).toBe('login-form')
  })
})

describe('JSX element extraction — link page', () => {
  function getElements() {
    const project = new Project({ skipAddingFilesFromTsConfig: true })
    return parseTsxFile(join(FIXTURES, 'link-page.tsx'), '/', project).elements
  }

  it('extracts Link components as link type', () => {
    const els = getElements()
    const links = els.filter(e => e.type === 'link')
    expect(links.length).toBeGreaterThanOrEqual(2)
  })

  it('extracts navigatesTo from Link href', () => {
    const els = getElements()
    const loginLink = els.find(e => e.navigatesTo === '/login')
    expect(loginLink).toBeDefined()
    expect(loginLink?.type).toBe('link')
  })

  it('extracts anchor tags as link type', () => {
    const els = getElements()
    const anchors = els.filter(e => e.jsxTag === 'a')
    expect(anchors.length).toBeGreaterThan(0)
    expect(anchors[0]?.type).toBe('link')
  })

  it('extracts select element', () => {
    const els = getElements()
    const sel = els.find(e => e.type === 'select')
    expect(sel).toBeDefined()
    expect(sel?.id).toBe('genre')
  })

  it('extracts textarea element', () => {
    const els = getElements()
    const ta = els.find(e => e.type === 'textarea')
    expect(ta).toBeDefined()
  })

  it('extracts checkbox as checkbox type', () => {
    const els = getElements()
    const cb = els.find(e => e.type === 'checkbox')
    expect(cb).toBeDefined()
  })

  it('extracts radio as radio type', () => {
    const els = getElements()
    const radio = els.find(e => e.type === 'radio')
    expect(radio).toBeDefined()
  })

  it('extracts search input as textbox', () => {
    const els = getElements()
    const search = els.find(e => e.id === 'search')
    expect(search?.type).toBe('textbox')
    expect(search?.inputType).toBe('search')
  })
})

describe('JSX element extraction — auth guarded page', () => {
  function getElements() {
    const project = new Project({ skipAddingFilesFromTsConfig: true })
    return parseTsxFile(join(FIXTURES, 'auth-guarded.tsx'), '/dashboard', project).elements
  }

  it('extracts buttons on auth-guarded page', () => {
    const els = getElements()
    const btns = els.filter(e => e.type === 'button')
    expect(btns.length).toBe(2)
  })

  it('marks disabled button with disabled attribute', () => {
    const els = getElements()
    const settings = els.find(e => e.id === 'settings')
    expect(settings?.attributes).toContain('disabled')
  })
})
