import { describe, it, expect } from 'vitest'
import { Project } from 'ts-morph'
import { parseTsxFile } from '../../src/parser/tsx-parser.js'
import { parseSurfaiceTags } from '../../src/jsdoc/surfaice-tags.js'
import { mapActionsToElements } from '../../src/jsdoc/action-mapper.js'

function setup(code: string) {
  const project = new Project({ useInMemoryFileSystem: true, skipAddingFilesFromTsConfig: true })
  const sf = project.createSourceFile('page.tsx', code)
  const page = parseTsxFile('page.tsx', '/test', project)
  const tags = parseSurfaiceTags(sf)
  const actions = mapActionsToElements(tags, page.elements, sf)
  return { page, tags, actions, sf }
}

// ─── Direct onSubmit match ───────────────────────────────────────────────────
describe('direct onSubmit match', () => {
  const code = `
    /** @surfaice action: POST /user/login, fields: [email, password] */
    async function handleSubmit(e: any) { e.preventDefault() }

    export default function Page() {
      return (
        <form id="login-form" onSubmit={handleSubmit}>
          <input id="email" type="email" required />
          <input id="password" type="password" required />
          <button type="submit" id="submit">Sign In</button>
        </form>
      )
    }
  `

  it('produces one mapped action', () => {
    expect(setup(code).actions).toHaveLength(1)
  })

  it('action string is correct', () => {
    expect(setup(code).actions[0]?.action).toBe('POST /user/login')
  })

  it('fields reference input element IDs', () => {
    expect(setup(code).actions[0]?.fields).toEqual(['email', 'password'])
  })

  it('elementId is the submit button', () => {
    expect(setup(code).actions[0]?.elementId).toBe('submit')
  })
})

// ─── onClick match ───────────────────────────────────────────────────────────
describe('direct onClick match', () => {
  const code = `
    /** @surfaice action: DELETE /api/account, fields: [] */
    async function handleDelete() {}

    export default function Page() {
      return (
        <div>
          <button id="delete-btn" onClick={handleDelete}>Delete Account</button>
        </div>
      )
    }
  `

  it('maps onClick handler to button element', () => {
    const { actions } = setup(code)
    expect(actions).toHaveLength(1)
    expect(actions[0]?.elementId).toBe('delete-btn')
    expect(actions[0]?.action).toBe('DELETE /api/account')
  })
})

// ─── router.push result detection ────────────────────────────────────────────
describe('navigates detection from router.push', () => {
  const code = `
    /** @surfaice action: POST /user/login, fields: [email, password] */
    async function handleSubmit(e: any) {
      await login()
      router.push('/dashboard')
    }

    export default function Page() {
      return (
        <form onSubmit={handleSubmit}>
          <input id="email" type="email" />
          <input id="password" type="password" />
          <button type="submit" id="submit">Go</button>
        </form>
      )
    }
  `

  it('extracts navigates result from router.push', () => {
    const { actions } = setup(code)
    expect(actions[0]?.result).toBe('navigates: /dashboard')
  })
})

// ─── Proximity fallback ───────────────────────────────────────────────────────
describe('proximity fallback — no direct handler match', () => {
  const code = `
    /** @surfaice action: POST /api/data, fields: [name] */
    async function handleSave() {}

    export default function Page() {
      return (
        <div>
          <input id="name" type="text" />
          <button type="submit" id="save-btn">Save</button>
        </div>
      )
    }
  `

  it('falls back to first submit button when no onSubmit match', () => {
    const { actions } = setup(code)
    expect(actions).toHaveLength(1)
    expect(actions[0]?.elementId).toBe('save-btn')
  })
})

// ─── Multiple actions ─────────────────────────────────────────────────────────
describe('multiple actions in one file', () => {
  const code = `
    /** @surfaice action: POST /user/login, fields: [email, password] */
    async function handleLogin(e: any) {}

    /** @surfaice action: PUT /api/profile, fields: [username] */
    async function handleUpdate(e: any) {}

    export default function Page() {
      return (
        <div>
          <form id="login-form" onSubmit={handleLogin}>
            <input id="email" type="email" />
            <input id="password" type="password" />
            <button type="submit" id="login-btn">Login</button>
          </form>
          <form id="profile-form" onSubmit={handleUpdate}>
            <input id="username" type="text" />
            <button type="submit" id="update-btn">Save</button>
          </form>
        </div>
      )
    }
  `

  it('returns two mapped actions', () => {
    expect(setup(code).actions).toHaveLength(2)
  })

  it('each action maps to correct button', () => {
    const { actions } = setup(code)
    const loginAction = actions.find(a => a.action === 'POST /user/login')
    const updateAction = actions.find(a => a.action === 'PUT /api/profile')
    expect(loginAction?.elementId).toBe('login-btn')
    expect(updateAction?.elementId).toBe('update-btn')
  })
})

// ─── No tags ──────────────────────────────────────────────────────────────────
describe('no @surfaice tags', () => {
  const code = `
    export default function Page() {
      return <div><button id="btn">Click</button></div>
    }
  `
  it('returns empty array', () => {
    expect(setup(code).actions).toEqual([])
  })
})
