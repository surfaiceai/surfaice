import { describe, it, expect } from 'vitest'
import { parse } from '../../src/parser'
import { serialize } from '../../src/serializer'
import type { SurfaicePage } from '../../src/types'

// Roundtrip: parse(serialize(page)) must equal page (structurally)
function roundtrip(page: SurfaicePage): SurfaicePage {
  return parse(serialize(page))
}

describe('roundtrip stability', () => {
  it('minimal page round-trips cleanly', () => {
    const page: SurfaicePage = { version: 'v1', route: '/home', sections: [] }
    expect(roundtrip(page)).toMatchObject(page)
  })

  it('page with name and states round-trips', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/settings', name: 'Settings', states: ['auth-required'], sections: [],
    }
    const result = roundtrip(page)
    expect(result.name).toBe('Settings')
    expect(result.states).toEqual(['auth-required'])
  })

  it('page with elements round-trips', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/test', sections: [
        {
          name: 'Profile', elements: [
            { id: 'name', type: 'textbox', label: 'Display Name', current: '{user.name}', accepts: 'string' },
            { id: 'save', type: 'button', label: 'Save', attributes: ['destructive'], action: 'PUT /api/profile', result: "toast 'Saved!'" },
          ],
        },
      ],
    }
    const result = roundtrip(page)
    expect(result.sections[0].name).toBe('Profile')
    expect(result.sections[0].elements[0].id).toBe('name')
    expect(result.sections[0].elements[0].current).toBe('{user.name}')
    expect(result.sections[0].elements[1].action).toBe('PUT /api/profile')
  })

  it('page with reveals round-trips', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/test', sections: [{
        name: 'Section', elements: [{
          id: 'toggle', type: 'toggle', label: 'Show More',
          reveals: [{ id: 'extra', type: 'textbox', label: 'Extra' }],
        }],
      }],
    }
    const result = roundtrip(page)
    expect(result.sections[0].elements[0].reveals).toHaveLength(1)
    expect(result.sections[0].elements[0].reveals![0].id).toBe('extra')
  })

  it('double roundtrip is stable: parse(serialize(parse(serialize(page)))) == parse(serialize(page))', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/settings', sections: [
        { name: 'Profile', elements: [{ id: 'name', type: 'textbox', label: 'Display Name' }] },
      ],
    }
    const once = roundtrip(page)
    const twice = roundtrip(once)
    expect(twice).toEqual(once)
  })
})
