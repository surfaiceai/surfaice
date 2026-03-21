import { describe, it, expect } from 'vitest'
import { diff } from '../src/differ.js'
import type { SurfaicePage } from '@surfaice/format'

function twoPageDiff(expEl: object, actEl: object) {
  const expected: SurfaicePage = {
    version: 'v1', route: '/test',
    sections: [{ name: 'S', elements: [{ id: 'btn', type: 'button', label: 'Old', ...expEl }] }],
  }
  const actual: SurfaicePage = {
    version: 'v1', route: '/test',
    sections: [{ name: 'S', elements: [{ id: 'btn', type: 'button', label: 'Old', ...actEl }] }],
  }
  return diff(expected, actual)
}

describe('diff — changed elements', () => {
  it('detects label change', () => {
    const result = twoPageDiff({ label: 'Save' }, { label: 'Save Changes' })
    expect(result.status).toBe('drift')
    expect(result.changed.some(c => c.field === 'label')).toBe(true)
    const change = result.changed.find(c => c.field === 'label')!
    expect(change.expected).toBe('Save')
    expect(change.actual).toBe('Save Changes')
  })

  it('detects action change', () => {
    const result = twoPageDiff({ action: 'PUT /api/v1/profile' }, { action: 'PUT /api/v2/profile' })
    const change = result.changed.find(c => c.field === 'action')!
    expect(change).toBeDefined()
    expect(change.expected).toBe('PUT /api/v1/profile')
    expect(change.actual).toBe('PUT /api/v2/profile')
  })

  it('detects type change', () => {
    const expected: SurfaicePage = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [{ id: 'x', type: 'button', label: 'X' }] }],
    }
    const actual: SurfaicePage = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [{ id: 'x', type: 'link', label: 'X' }] }],
    }
    const result = diff(expected, actual)
    expect(result.changed.some(c => c.field === 'type')).toBe(true)
  })

  it('detects attributes change', () => {
    const result = twoPageDiff(
      { attributes: ['required'] },
      { attributes: ['required', 'destructive'] }
    )
    expect(result.changed.some(c => c.field === 'attributes')).toBe(true)
  })

  it('includes element id and section in change', () => {
    const result = twoPageDiff({ label: 'Old' }, { label: 'New' })
    const change = result.changed.find(c => c.field === 'label')!
    expect(change.id).toBe('btn')
    expect(change.section).toBe('S')
  })

  it('summary includes changed count', () => {
    const result = twoPageDiff({ label: 'Old', action: 'GET /a' }, { label: 'New', action: 'GET /b' })
    expect(result.summary).toContain('changed')
  })
})
