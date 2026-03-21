import { describe, it, expect } from 'vitest'
import { parse } from '../../src/parser'

describe('parse — frontmatter', () => {
  it('parses required fields: version and route', () => {
    const input = `---
surfaice: v1
route: /settings
---

# /settings
`
    const page = parse(input)
    expect(page.version).toBe('v1')
    expect(page.route).toBe('/settings')
  })

  it('parses optional name', () => {
    const input = `---
surfaice: v1
route: /settings
name: Settings Page
---

# /settings
`
    const page = parse(input)
    expect(page.name).toBe('Settings Page')
  })

  it('parses states array', () => {
    const input = `---
surfaice: v1
route: /settings
states: [auth-required, premium-only]
---

# /settings
`
    const page = parse(input)
    expect(page.states).toEqual(['auth-required', 'premium-only'])
  })

  it('parses capabilities', () => {
    const input = `---
surfaice: v1
route: /settings
capabilities:
  - id: update-profile
    description: "User updates their display name"
    elements: [name, save]
---

# /settings
`
    const page = parse(input)
    expect(page.capabilities).toHaveLength(1)
    expect(page.capabilities![0].id).toBe('update-profile')
    expect(page.capabilities![0].elements).toEqual(['name', 'save'])
  })

  it('handles missing optional fields gracefully', () => {
    const input = `---
surfaice: v1
route: /home
---

# /home
`
    const page = parse(input)
    expect(page.name).toBeUndefined()
    expect(page.states).toBeUndefined()
    expect(page.capabilities).toBeUndefined()
    expect(page.sections).toEqual([])
  })
})
