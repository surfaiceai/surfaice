import { describe, it, expect } from 'vitest'
import { parse } from '../../src/parser'

const wrap = (lines: string) => `---
surfaice: v1
route: /test
---

# /test

## Section
${lines}
`

describe('parse — reveals (nested elements)', () => {
  it('parses a parent element with one revealed child', () => {
    const input = wrap(`- [toggle] toggle "Show Advanced" → reveals:
  - [advanced-name] textbox "Advanced Name"`)
    const page = parse(input)
    const parent = page.sections[0].elements[0]
    expect(parent.id).toBe('toggle')
    expect(parent.reveals).toHaveLength(1)
    expect(parent.reveals![0].id).toBe('advanced-name')
    expect(parent.reveals![0].type).toBe('textbox')
  })

  it('parses multiple revealed children', () => {
    const input = wrap(`- [expand] button "Expand Options" → reveals:
  - [opt-a] checkbox "Option A"
  - [opt-b] checkbox "Option B"`)
    const page = parse(input)
    const parent = page.sections[0].elements[0]
    expect(parent.reveals).toHaveLength(2)
    expect(parent.reveals![0].id).toBe('opt-a')
    expect(parent.reveals![1].id).toBe('opt-b')
  })

  it('sibling after reveals block belongs to parent section', () => {
    const input = wrap(`- [toggle] toggle "Show More" → reveals:
  - [extra] textbox "Extra Field"
- [save] button "Save"`)
    const page = parse(input)
    expect(page.sections[0].elements).toHaveLength(2)
    expect(page.sections[0].elements[1].id).toBe('save')
    expect(page.sections[0].elements[1].reveals).toBeUndefined()
  })
})
