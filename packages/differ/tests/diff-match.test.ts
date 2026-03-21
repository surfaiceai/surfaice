import { describe, it, expect } from 'vitest'
import { diff } from '../src/differ.js'
import type { SurfaicePage } from '@surfaice/format'

const page = (): SurfaicePage => ({
  version: 'v1', route: '/settings',
  sections: [{ name: 'Profile', elements: [
    { id: 'name', type: 'textbox', label: 'Display Name', current: '{user.name}' },
    { id: 'save', type: 'button', label: 'Save Changes', action: 'PUT /api/profile' },
  ]}],
})

describe('diff — identical pages', () => {
  it('returns status match when pages are identical', () => {
    const result = diff(page(), page())
    expect(result.status).toBe('match')
  })

  it('returns empty added/removed/changed arrays', () => {
    const result = diff(page(), page())
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('summary says no drift detected', () => {
    const result = diff(page(), page())
    expect(result.summary).toBe('No drift detected')
  })

  it('sets route from expected page', () => {
    const result = diff(page(), page())
    expect(result.route).toBe('/settings')
  })
})
