import { describe, it, expect } from 'vitest'
import { diff } from '../src/differ.js'
import type { SurfaicePage } from '@surfaice/format'

describe('diff — nested reveals', () => {
  it('detects added element inside reveals', () => {
    const expected: SurfaicePage = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [
        { id: 'toggle', type: 'toggle', label: 'Show More', reveals: [] },
      ]}],
    }
    const actual: SurfaicePage = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [
        { id: 'toggle', type: 'toggle', label: 'Show More', reveals: [
          { id: 'extra', type: 'textbox', label: 'Extra Field' },
        ]},
      ]}],
    }
    const result = diff(expected, actual)
    expect(result.added.some(a => a.id === 'extra')).toBe(true)
  })

  it('detects removed element inside reveals', () => {
    const expected: SurfaicePage = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [
        { id: 'toggle', type: 'toggle', label: 'Show', reveals: [
          { id: 'hidden', type: 'textbox', label: 'Hidden' },
        ]},
      ]}],
    }
    const actual: SurfaicePage = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [
        { id: 'toggle', type: 'toggle', label: 'Show', reveals: [] },
      ]}],
    }
    const result = diff(expected, actual)
    expect(result.removed.some(r => r.id === 'hidden')).toBe(true)
  })
})
