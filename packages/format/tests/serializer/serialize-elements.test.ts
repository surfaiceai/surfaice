import { describe, it, expect } from 'vitest'
import { serialize } from '../../src/serializer'
import type { SurfaicePage } from '../../src/types'

const basePage = (): SurfaicePage => ({
  version: 'v1',
  route: '/test',
  sections: [],
})

const pageWithEl = (el: Parameters<typeof basePage>[0] extends { sections: infer S } ? never : never, element: SurfaicePage['sections'][0]['elements'][0]): SurfaicePage => ({
  ...basePage(),
  sections: [{ name: 'Section', elements: [element] }],
})

// Helper: build a minimal page with one element
function page(element: SurfaicePage['sections'][0]['elements'][0]): SurfaicePage {
  return {
    version: 'v1',
    route: '/test',
    sections: [{ name: 'Section', elements: [element] }],
  }
}

describe('serialize — element lines', () => {
  it('serializes minimal element', () => {
    const md = serialize(page({ id: 'submit', type: 'button', label: 'Submit' }))
    expect(md).toContain('- [submit] button "Submit"')
  })

  it('serializes element with attributes', () => {
    const md = serialize(page({
      id: 'save', type: 'button', label: 'Save Changes',
      attributes: ['destructive', 'required'],
    }))
    expect(md).toContain('- [save] button "Save Changes" (destructive, required)')
  })

  it('serializes HTTP action', () => {
    const md = serialize(page({ id: 'save', type: 'button', label: 'Save', action: 'PUT /api/profile' }))
    expect(md).toContain('→ PUT /api/profile')
  })

  it('serializes action and result', () => {
    const md = serialize(page({
      id: 'save', type: 'button', label: 'Save',
      action: 'PUT /api/profile', result: "toast 'Saved!'",
    }))
    expect(md).toContain("→ PUT /api/profile → toast 'Saved!'")
  })

  it('serializes navigates', () => {
    const md = serialize(page({ id: 'back', type: 'link', label: 'Go Back', navigates: '/dashboard' }))
    expect(md).toContain('→ navigates: /dashboard')
  })

  it('serializes current binding', () => {
    const md = serialize(page({ id: 'name', type: 'textbox', label: 'Name', current: '{user.name}' }))
    expect(md).toContain('→ current: {user.name}')
  })

  it('serializes accepts', () => {
    const md = serialize(page({ id: 'email', type: 'textbox', label: 'Email', accepts: 'email' }))
    expect(md).toContain('→ accepts: email')
  })

  it('serializes options', () => {
    const md = serialize(page({ id: 'theme', type: 'select', label: 'Theme', options: ['Light', 'Dark', 'System'] }))
    expect(md).toContain('→ options: Light, Dark, System')
  })

  it('serializes shows', () => {
    const md = serialize(page({ id: 'count', type: 'badge', label: 'Notifications', shows: '{notifications.count}' }))
    expect(md).toContain('→ shows: {notifications.count}')
  })

  it('serializes nested reveals', () => {
    const md = serialize(page({
      id: 'toggle', type: 'toggle', label: 'Show More',
      reveals: [{ id: 'extra', type: 'textbox', label: 'Extra Field' }],
    }))
    expect(md).toContain('→ reveals:')
    expect(md).toContain('  - [extra] textbox "Extra Field"')
  })
})
