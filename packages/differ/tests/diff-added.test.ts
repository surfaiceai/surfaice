import { describe, it, expect } from 'vitest'
import { diff } from '../src/differ.js'
import type { SurfaicePage } from '@surfaice/format'

const base = (): SurfaicePage => ({
  version: 'v1', route: '/settings',
  sections: [{ name: 'Profile', elements: [
    { id: 'name', type: 'textbox', label: 'Display Name' },
  ]}],
})

describe('diff — added elements', () => {
  it('detects element in actual not in expected', () => {
    const expected = base()
    const actual: SurfaicePage = {
      ...base(),
      sections: [{ name: 'Profile', elements: [
        { id: 'name', type: 'textbox', label: 'Display Name' },
        { id: 'save', type: 'button', label: 'Save' },
      ]}],
    }
    const result = diff(expected, actual)
    expect(result.status).toBe('drift')
    expect(result.added).toHaveLength(1)
    expect(result.added[0].id).toBe('save')
    expect(result.added[0].section).toBe('Profile')
  })

  it('detects multiple added elements', () => {
    const expected = base()
    const actual: SurfaicePage = {
      ...base(),
      sections: [{ name: 'Profile', elements: [
        { id: 'name', type: 'textbox', label: 'Display Name' },
        { id: 'save', type: 'button', label: 'Save' },
        { id: 'cancel', type: 'button', label: 'Cancel' },
      ]}],
    }
    const result = diff(expected, actual)
    expect(result.added).toHaveLength(2)
  })

  it('summary includes added count', () => {
    const expected = base()
    const actual: SurfaicePage = {
      ...base(),
      sections: [{ name: 'Profile', elements: [
        { id: 'name', type: 'textbox', label: 'Display Name' },
        { id: 'save', type: 'button', label: 'Save' },
      ]}],
    }
    const result = diff(expected, actual)
    expect(result.summary).toContain('1 added')
  })
})
