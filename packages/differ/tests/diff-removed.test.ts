import { describe, it, expect } from 'vitest'
import { diff } from '../src/differ.js'
import type { SurfaicePage } from '@surfaice/format'

describe('diff — removed elements', () => {
  it('detects element in expected not in actual', () => {
    const expected: SurfaicePage = {
      version: 'v1', route: '/settings',
      sections: [{ name: 'Profile', elements: [
        { id: 'name', type: 'textbox', label: 'Display Name' },
        { id: 'save', type: 'button', label: 'Save' },
      ]}],
    }
    const actual: SurfaicePage = {
      version: 'v1', route: '/settings',
      sections: [{ name: 'Profile', elements: [
        { id: 'name', type: 'textbox', label: 'Display Name' },
      ]}],
    }
    const result = diff(expected, actual)
    expect(result.status).toBe('drift')
    expect(result.removed).toHaveLength(1)
    expect(result.removed[0].id).toBe('save')
    expect(result.removed[0].section).toBe('Profile')
  })

  it('summary includes removed count', () => {
    const expected: SurfaicePage = {
      version: 'v1', route: '/settings',
      sections: [{ name: 'S', elements: [
        { id: 'a', type: 'button', label: 'A' },
        { id: 'b', type: 'button', label: 'B' },
      ]}],
    }
    const actual: SurfaicePage = {
      version: 'v1', route: '/settings',
      sections: [{ name: 'S', elements: [] }],
    }
    const result = diff(expected, actual)
    expect(result.summary).toContain('2 removed')
  })
})
