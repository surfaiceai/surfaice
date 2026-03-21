import { describe, it, expect } from 'vitest'
import { serialize } from '../../src/serializer'
import type { SurfaicePage } from '../../src/types'

describe('serialize — full page', () => {
  it('serializes frontmatter with version and route', () => {
    const page: SurfaicePage = { version: 'v1', route: '/settings', sections: [] }
    const md = serialize(page)
    expect(md).toContain('surfaice: v1')
    expect(md).toContain('route: /settings')
  })

  it('serializes optional name', () => {
    const page: SurfaicePage = { version: 'v1', route: '/settings', name: 'Settings Page', sections: [] }
    const md = serialize(page)
    expect(md).toContain('name: Settings Page')
  })

  it('serializes states array', () => {
    const page: SurfaicePage = { version: 'v1', route: '/settings', states: ['auth-required', 'premium-only'], sections: [] }
    const md = serialize(page)
    expect(md).toContain('states: [auth-required, premium-only]')
  })

  it('serializes capabilities', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/settings', sections: [],
      capabilities: [{ id: 'update-profile', description: 'User updates display name', elements: ['name', 'save'] }],
    }
    const md = serialize(page)
    expect(md).toContain('capabilities:')
    expect(md).toContain('  - id: update-profile')
    expect(md).toContain('    description: "User updates display name"')
    expect(md).toContain('    elements: [name, save]')
  })

  it('serializes sections and elements', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/settings', sections: [
        { name: 'Profile', elements: [{ id: 'name', type: 'textbox', label: 'Display Name' }] },
      ],
    }
    const md = serialize(page)
    expect(md).toContain('## Profile')
    expect(md).toContain('- [name] textbox "Display Name"')
  })

  it('serializes page states block', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/settings', sections: [],
      pageStates: [{ name: 'loading', changes: [{ elementId: 'save', modifier: '~', description: 'disabled, shows spinner' }] }],
    }
    const md = serialize(page)
    expect(md).toContain('## States')
    expect(md).toContain('[loading]: ~ save disabled, shows spinner')
  })

  it('outputs page heading with route', () => {
    const page: SurfaicePage = { version: 'v1', route: '/settings', sections: [] }
    const md = serialize(page)
    expect(md).toContain('# /settings')
  })

  it('ends with a newline', () => {
    const page: SurfaicePage = { version: 'v1', route: '/settings', sections: [] }
    const md = serialize(page)
    expect(md.endsWith('\n')).toBe(true)
  })
})
