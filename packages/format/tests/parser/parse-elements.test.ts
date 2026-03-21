import { describe, it, expect } from 'vitest'
import { parse } from '../../src/parser'

const wrap = (elementLines: string) => `---
surfaice: v1
route: /test
---

# /test

## Section
${elementLines}
`

describe('parse — element lines', () => {
  it('parses minimal element: id, type, label', () => {
    const page = parse(wrap('- [submit] button "Submit"'))
    const el = page.sections[0].elements[0]
    expect(el.id).toBe('submit')
    expect(el.type).toBe('button')
    expect(el.label).toBe('Submit')
  })

  it('parses attributes in parentheses', () => {
    const page = parse(wrap('- [save] button "Save Changes" (destructive, required)'))
    const el = page.sections[0].elements[0]
    expect(el.attributes).toEqual(['destructive', 'required'])
  })

  it('parses HTTP action', () => {
    const page = parse(wrap('- [save] button "Save Changes" → PUT /api/profile'))
    const el = page.sections[0].elements[0]
    expect(el.action).toBe('PUT /api/profile')
  })

  it('parses action and result', () => {
    const page = parse(wrap("- [save] button \"Save Changes\" → PUT /api/profile → toast 'Saved!'"))
    const el = page.sections[0].elements[0]
    expect(el.action).toBe('PUT /api/profile')
    expect(el.result).toBe("toast 'Saved!'")
  })

  it('parses navigates', () => {
    const page = parse(wrap('- [back] link "Go Back" → navigates: /dashboard'))
    const el = page.sections[0].elements[0]
    expect(el.navigates).toBe('/dashboard')
  })

  it('parses current binding', () => {
    const page = parse(wrap('- [name] textbox "Display Name" → current: {user.name}'))
    const el = page.sections[0].elements[0]
    expect(el.current).toBe('{user.name}')
  })

  it('parses accepts hint', () => {
    const page = parse(wrap('- [email] textbox "Email Address" → accepts: email'))
    const el = page.sections[0].elements[0]
    expect(el.accepts).toBe('email')
  })

  it('parses options for select', () => {
    const page = parse(wrap('- [theme] select "Theme" → options: Light, Dark, System'))
    const el = page.sections[0].elements[0]
    expect(el.options).toEqual(['Light', 'Dark', 'System'])
  })

  it('parses shows for display elements', () => {
    const page = parse(wrap('- [count] badge "Notifications" → shows: {notifications.count}'))
    const el = page.sections[0].elements[0]
    expect(el.shows).toBe('{notifications.count}')
  })

  it('parses confirms result', () => {
    const page = parse(wrap('- [delete] button "Delete Account" (destructive) → DELETE /api/account → confirms: "Are you sure?"'))
    const el = page.sections[0].elements[0]
    expect(el.action).toBe('DELETE /api/account')
    expect(el.result).toBe('confirms: "Are you sure?"')
  })

  it('parses multiple elements in a section', () => {
    const input = wrap(`- [name] textbox "Display Name" → current: {user.name}
- [save] button "Save Changes" → PUT /api/profile → toast 'Saved!'`)
    const page = parse(input)
    expect(page.sections[0].elements).toHaveLength(2)
    expect(page.sections[0].elements[0].id).toBe('name')
    expect(page.sections[0].elements[1].id).toBe('save')
  })

  it('ignores non-element list items', () => {
    const page = parse(wrap('- just a plain list item without brackets'))
    expect(page.sections[0].elements).toHaveLength(0)
  })
})
