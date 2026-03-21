import { describe, it, expect } from 'vitest'
import { parse } from '../../src/parser'

describe('parse — page states block', () => {
  it('parses a single state with one change', () => {
    const input = `---
surfaice: v1
route: /settings
---

# /settings

## Profile
- [save] button "Save"

## States
- [loading]: ~ save disabled, shows spinner
`
    const page = parse(input)
    expect(page.pageStates).toHaveLength(1)
    expect(page.pageStates![0].name).toBe('loading')
    expect(page.pageStates![0].changes).toHaveLength(1)
    expect(page.pageStates![0].changes[0].elementId).toBe('save')
    expect(page.pageStates![0].changes[0].modifier).toBe('~')
  })

  it('parses add (+) and remove (-) modifiers', () => {
    const input = `---
surfaice: v1
route: /settings
---

# /settings

## States
- [error]: + error-msg shown
- [success]: - form hidden
`
    const page = parse(input)
    expect(page.pageStates).toHaveLength(2)
    expect(page.pageStates![0].changes[0].modifier).toBe('+')
    expect(page.pageStates![1].changes[0].modifier).toBe('-')
  })

  it('returns undefined pageStates when no States section', () => {
    const input = `---
surfaice: v1
route: /settings
---

# /settings

## Profile
- [save] button "Save"
`
    const page = parse(input)
    expect(page.pageStates).toBeUndefined()
  })
})
