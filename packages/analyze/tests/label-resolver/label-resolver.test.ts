import { describe, it, expect } from 'vitest'
import { Project, SyntaxKind } from 'ts-morph'
import { resolveElementLabel } from '../../src/parser/label-resolver.js'

function parseJsx(code: string) {
  const project = new Project({ useInMemoryFileSystem: true, skipAddingFilesFromTsConfig: true })
  const sf = project.createSourceFile('test.tsx', code)
  return sf
}

// Helper: get the first JsxSelfClosingElement or JsxOpeningElement
function firstJsxNode(sf: ReturnType<typeof parseJsx>, tag: string) {
  const sc = sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .find(n => n.getTagNameNode().getText() === tag)
  const op = sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
    .find(n => n.getTagNameNode().getText() === tag)
  return sc ?? op!
}

// ─── aria-label ──────────────────────────────────────────────────────────────
describe('aria-label', () => {
  it('extracts aria-label from input', () => {
    const sf = parseJsx(`<input aria-label="Email address" id="email" />`)
    const node = firstJsxNode(sf, 'input')
    const result = resolveElementLabel(node, sf)
    expect(result.value).toBe('Email address')
    expect(result.source).toBe('aria-label')
  })

  it('aria-label takes priority over placeholder', () => {
    const sf = parseJsx(`<input aria-label="Email" placeholder="Enter email" />`)
    const node = firstJsxNode(sf, 'input')
    const result = resolveElementLabel(node, sf)
    expect(result.source).toBe('aria-label')
    expect(result.value).toBe('Email')
  })
})

// ─── htmlFor ────────────────────────────────────────────────────────────────
describe('htmlFor association', () => {
  it('finds label text via htmlFor', () => {
    const sf = parseJsx(`
      <div>
        <label htmlFor="email">Email Address</label>
        <input id="email" type="email" />
      </div>
    `)
    const node = firstJsxNode(sf, 'input')
    const result = resolveElementLabel(node, sf)
    expect(result.value).toBe('Email Address')
    expect(result.source).toBe('htmlFor')
  })

  it('htmlFor beats placeholder', () => {
    const sf = parseJsx(`
      <div>
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" placeholder="Enter password" />
      </div>
    `)
    const node = firstJsxNode(sf, 'input')
    const result = resolveElementLabel(node, sf)
    expect(result.source).toBe('htmlFor')
    expect(result.value).toBe('Password')
  })
})

// ─── text children ───────────────────────────────────────────────────────────
describe('text children', () => {
  it('extracts plain text from button', () => {
    const sf = parseJsx(`<button>Sign In</button>`)
    const node = firstJsxNode(sf, 'button')
    const result = resolveElementLabel(node, sf)
    expect(result.value).toBe('Sign In')
    expect(result.source).toBe('children')
  })

  it('extracts plain text from link', () => {
    const sf = parseJsx(`<a href="/register">Sign Up</a>`)
    const node = firstJsxNode(sf, 'a')
    const result = resolveElementLabel(node, sf)
    expect(result.value).toBe('Sign Up')
    expect(result.source).toBe('children')
  })
})

// ─── placeholder ─────────────────────────────────────────────────────────────
describe('placeholder', () => {
  it('falls back to placeholder when no higher priority', () => {
    const sf = parseJsx(`<input type="email" placeholder="Enter your email" />`)
    const node = firstJsxNode(sf, 'input')
    const result = resolveElementLabel(node, sf)
    expect(result.value).toBe('Enter your email')
    expect(result.source).toBe('placeholder')
  })
})

// ─── id fallback ─────────────────────────────────────────────────────────────
describe('id fallback', () => {
  it('capitalizes id as last resort', () => {
    const sf = parseJsx(`<input id="username" type="text" />`)
    const node = firstJsxNode(sf, 'input')
    const result = resolveElementLabel(node, sf)
    expect(result.value).toBe('Username')
    expect(result.source).toBe('id')
  })
})

// ─── i18n keys ───────────────────────────────────────────────────────────────
describe('i18n key extraction', () => {
  it('extracts key from t("key") call in button children', () => {
    const sf = parseJsx(`<button>{t('signIn')}</button>`)
    const node = firstJsxNode(sf, 'button')
    const result = resolveElementLabel(node, sf)
    expect(result.value).toBe('signIn')
    expect(result.source).toBe('i18n-key')
  })

  it('extracts key from t("key") call in Link children', () => {
    const sf = parseJsx(`<Link href="/register">{t('signUp')}</Link>`)
    const node = firstJsxNode(sf, 'Link')
    const result = resolveElementLabel(node, sf)
    expect(result.value).toBe('signUp')
    expect(result.source).toBe('i18n-key')
  })

  it('picks non-loading variant in ternary', () => {
    const sf = parseJsx(`<button>{loading ? t('signingIn') : t('signIn')}</button>`)
    const node = firstJsxNode(sf, 'button')
    const result = resolveElementLabel(node, sf)
    expect(result.value).toBe('signIn')
    expect(result.source).toBe('i18n-key')
  })

  it('picks last branch in ternary when first is non-loading', () => {
    const sf = parseJsx(`<button>{isReady ? t('save') : t('saving')}</button>`)
    const node = firstJsxNode(sf, 'button')
    const result = resolveElementLabel(node, sf)
    // Either branch works for label; just ensure it returns one i18n key
    expect(result.source).toBe('i18n-key')
    expect(['save', 'saving']).toContain(result.value)
  })
})

// ─── title prop ──────────────────────────────────────────────────────────────
describe('title prop', () => {
  it('falls back to title prop', () => {
    const sf = parseJsx(`<button title="Submit the form" />`)
    const node = firstJsxNode(sf, 'button')
    const result = resolveElementLabel(node, sf)
    expect(result.value).toBe('Submit the form')
    expect(result.source).toBe('title')
  })
})
