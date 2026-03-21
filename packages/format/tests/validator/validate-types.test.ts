import { describe, it, expect } from 'vitest'
import { validate } from '../../src/validator'
import type { SurfaicePage } from '../../src/types'

describe('validate — element types', () => {
  it('passes for all valid element types', () => {
    const validTypes = [
      'button', 'textbox', 'textarea', 'link', 'select',
      'checkbox', 'radio', 'toggle', 'slider', 'image',
      'image-upload', 'badge', 'heading', 'text', 'list',
    ] as const
    for (const type of validTypes) {
      const page: SurfaicePage = {
        version: 'v1', route: '/test',
        sections: [{ name: 'S', elements: [{ id: 'el', type, label: 'El' }] }],
      }
      expect(validate(page), `type ${type} should be valid`).toEqual([])
    }
  })

  it('errors on unknown element type', () => {
    const page = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [{ id: 'el', type: 'dropdown', label: 'El' }] }],
    } as unknown as SurfaicePage
    const errors = validate(page)
    expect(errors.some(e => e.code === 'INVALID_TYPE')).toBe(true)
    expect(errors[0].message).toContain('dropdown')
  })

  it('errors on missing required fields', () => {
    const page = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [{ id: '', type: 'button', label: '' }] }],
    } as unknown as SurfaicePage
    const errors = validate(page)
    expect(errors.some(e => e.code === 'MISSING_REQUIRED')).toBe(true)
  })
})
