import { describe, it, expect } from 'vitest'
import { parse } from '../../src/parser'

describe('parse — sections', () => {
  it('parses a single section heading', () => {
    const input = `---
surfaice: v1
route: /settings
---

# /settings

## Profile
`
    const page = parse(input)
    expect(page.sections).toHaveLength(1)
    expect(page.sections[0].name).toBe('Profile')
  })

  it('parses multiple sections', () => {
    const input = `---
surfaice: v1
route: /settings
---

# /settings

## Profile

## Security

## Notifications
`
    const page = parse(input)
    expect(page.sections).toHaveLength(3)
    expect(page.sections.map(s => s.name)).toEqual(['Profile', 'Security', 'Notifications'])
  })

  it('skips the States section (treated separately)', () => {
    const input = `---
surfaice: v1
route: /settings
---

# /settings

## Profile

## States
- [loading]: ~ save disabled
`
    const page = parse(input)
    expect(page.sections).toHaveLength(1)
    expect(page.sections[0].name).toBe('Profile')
  })

  it('section with no elements has empty elements array', () => {
    const input = `---
surfaice: v1
route: /settings
---

# /settings

## EmptySection
`
    const page = parse(input)
    expect(page.sections[0].elements).toEqual([])
  })
})
