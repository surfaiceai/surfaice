import { describe, it, expect } from 'vitest'
import { parse } from '../../src/parser'

const FULL_PAGE = `---
surfaice: v1
route: /settings
name: Settings Page
states: [auth-required]
capabilities:
  - id: update-profile
    description: "User updates their display name"
    elements: [name, save]
---

# /settings

## Profile
- [name] textbox "Display Name" → current: {user.name} → accepts: string
- [email] textbox "Email" (readonly) → shows: {user.email}
- [save] button "Save Changes" (destructive) → PUT /api/profile → toast 'Saved!'

## Notifications
- [notify-toggle] toggle "Email Notifications" → current: {user.notificationsEnabled}

## States
- [loading]: ~ save disabled, shows spinner
`

describe('parse — full page integration', () => {
  it('parses a complete .surfaice.md file', () => {
    const page = parse(FULL_PAGE)

    expect(page.version).toBe('v1')
    expect(page.route).toBe('/settings')
    expect(page.name).toBe('Settings Page')
    expect(page.states).toEqual(['auth-required'])
    expect(page.capabilities).toHaveLength(1)
    expect(page.sections).toHaveLength(2)
    expect(page.pageStates).toHaveLength(1)
  })

  it('correctly parses Profile section elements', () => {
    const page = parse(FULL_PAGE)
    const profile = page.sections[0]
    expect(profile.name).toBe('Profile')
    expect(profile.elements).toHaveLength(3)

    const name = profile.elements[0]
    expect(name.id).toBe('name')
    expect(name.type).toBe('textbox')
    expect(name.current).toBe('{user.name}')
    expect(name.accepts).toBe('string')

    const email = profile.elements[1]
    expect(email.attributes).toEqual(['readonly'])
    expect(email.shows).toBe('{user.email}')

    const save = profile.elements[2]
    expect(save.attributes).toEqual(['destructive'])
    expect(save.action).toBe('PUT /api/profile')
    expect(save.result).toBe("toast 'Saved!'")
  })

  it('correctly parses Notifications section', () => {
    const page = parse(FULL_PAGE)
    const notif = page.sections[1]
    expect(notif.name).toBe('Notifications')
    expect(notif.elements[0].id).toBe('notify-toggle')
    expect(notif.elements[0].type).toBe('toggle')
  })

  it('correctly parses page states', () => {
    const page = parse(FULL_PAGE)
    const loading = page.pageStates![0]
    expect(loading.name).toBe('loading')
    expect(loading.changes[0].elementId).toBe('save')
    expect(loading.changes[0].modifier).toBe('~')
  })
})
