import { describe, it, expect } from 'vitest'
import { Project } from 'ts-morph'
import { parseSurfaiceTags } from '../../src/jsdoc/surfaice-tags.js'

function parseFile(code: string) {
  const project = new Project({ useInMemoryFileSystem: true, skipAddingFilesFromTsConfig: true })
  return project.createSourceFile('test.tsx', code)
}

// ─── Action tags ─────────────────────────────────────────────────────────────
describe('action tag — async function', () => {
  const sf = parseFile(`
    /** @surfaice action: POST /user/login, fields: [email, password], returns: access_token */
    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
    }
  `)

  it('detects one tag', () => {
    expect(parseSurfaiceTags(sf)).toHaveLength(1)
  })

  it('kind is action', () => {
    expect(parseSurfaiceTags(sf)[0]?.kind).toBe('action')
  })

  it('parses action string', () => {
    expect(parseSurfaiceTags(sf)[0]?.action).toBe('POST /user/login')
  })

  it('parses fields array', () => {
    expect(parseSurfaiceTags(sf)[0]?.fields).toEqual(['email', 'password'])
  })

  it('parses returns', () => {
    expect(parseSurfaiceTags(sf)[0]?.returns).toBe('access_token')
  })

  it('attaches function name', () => {
    expect(parseSurfaiceTags(sf)[0]?.functionName).toBe('handleSubmit')
  })
})

describe('action tag — arrow function const', () => {
  const sf = parseFile(`
    /** @surfaice action: PUT /api/profile, fields: [username, bio] */
    const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault()
    }
  `)

  it('detects tag on const arrow function', () => {
    expect(parseSurfaiceTags(sf)).toHaveLength(1)
  })

  it('attaches const name as functionName', () => {
    expect(parseSurfaiceTags(sf)[0]?.functionName).toBe('handleUpdate')
  })

  it('parses fields correctly', () => {
    expect(parseSurfaiceTags(sf)[0]?.fields).toEqual(['username', 'bio'])
  })

  it('action is correct', () => {
    expect(parseSurfaiceTags(sf)[0]?.action).toBe('PUT /api/profile')
  })
})

describe('action tag — confirms field', () => {
  const sf = parseFile(`
    /** @surfaice action: DELETE /api/account, confirms: modal */
    async function handleDelete() {}
  `)

  it('parses confirms field', () => {
    const tag = parseSurfaiceTags(sf)[0]
    expect(tag?.confirms).toBe('modal')
  })
})

// ─── Auth tags ────────────────────────────────────────────────────────────────
describe('auth tag — multi-line', () => {
  const sf = parseFile(`
    /**
     * @surfaice auth
     * login: POST /user/login
     * fields: [email, password]
     * token: { from: body, path: data.access_token }
     * use: Authorization: Bearer {token}
     */
    async function login() {}
  `)

  it('detects auth tag', () => {
    const tags = parseSurfaiceTags(sf)
    expect(tags).toHaveLength(1)
    expect(tags[0]?.kind).toBe('auth')
  })

  it('parses login endpoint', () => {
    expect(parseSurfaiceTags(sf)[0]?.login).toBe('POST /user/login')
  })

  it('parses fields in auth tag', () => {
    expect(parseSurfaiceTags(sf)[0]?.fields).toEqual(['email', 'password'])
  })

  it('parses token.from and token.path', () => {
    const token = parseSurfaiceTags(sf)[0]?.token
    expect(token?.from).toBe('body')
    expect(token?.path).toBe('data.access_token')
  })

  it('parses use string', () => {
    expect(parseSurfaiceTags(sf)[0]?.use).toBe('Authorization: Bearer {token}')
  })

  it('attaches functionName from auth tag', () => {
    expect(parseSurfaiceTags(sf)[0]?.functionName).toBe('login')
  })
})

// ─── Multiple tags ────────────────────────────────────────────────────────────
describe('multiple tags in one file', () => {
  const sf = parseFile(`
    /** @surfaice action: POST /user/login, fields: [email, password] */
    async function handleLogin() {}

    /** @surfaice action: PUT /api/profile, fields: [username] */
    async function handleUpdate() {}
  `)

  it('returns two tags', () => {
    expect(parseSurfaiceTags(sf)).toHaveLength(2)
  })

  it('each tag has distinct functionName', () => {
    const names = parseSurfaiceTags(sf).map(t => t.functionName)
    expect(names).toContain('handleLogin')
    expect(names).toContain('handleUpdate')
  })
})

// ─── No tags ──────────────────────────────────────────────────────────────────
describe('no @surfaice tags', () => {
  const sf = parseFile(`
    /** Just a normal comment */
    async function doSomething() {}
    const x = 1
  `)

  it('returns empty array', () => {
    expect(parseSurfaiceTags(sf)).toEqual([])
  })
})
