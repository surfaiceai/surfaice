import { describe, it, expect } from 'vitest'
import { validate } from '../../src/validator'
import type { SurfaicePage } from '../../src/types'

describe('validate — element IDs', () => {
  it('passes when all element IDs are unique', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [
        { id: 'a', type: 'button', label: 'A' },
        { id: 'b', type: 'button', label: 'B' },
      ]}],
    }
    expect(validate(page)).toEqual([])
  })

  it('errors when duplicate element IDs exist within a section', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [
        { id: 'save', type: 'button', label: 'Save' },
        { id: 'save', type: 'button', label: 'Save Again' },
      ]}],
    }
    const errors = validate(page)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].code).toBe('DUPLICATE_ID')
    expect(errors[0].message).toContain('save')
  })

  it('errors when duplicate IDs span multiple sections', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/test',
      sections: [
        { name: 'A', elements: [{ id: 'submit', type: 'button', label: 'Submit' }] },
        { name: 'B', elements: [{ id: 'submit', type: 'button', label: 'Submit' }] },
      ],
    }
    const errors = validate(page)
    expect(errors.some(e => e.code === 'DUPLICATE_ID')).toBe(true)
  })

  it('checks IDs inside reveals too', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [
        { id: 'toggle', type: 'toggle', label: 'Toggle', reveals: [
          { id: 'toggle', type: 'textbox', label: 'Duplicate' },
        ]},
      ]}],
    }
    const errors = validate(page)
    expect(errors.some(e => e.code === 'DUPLICATE_ID')).toBe(true)
  })

  it('passes on empty page', () => {
    const page: SurfaicePage = { version: 'v1', route: '/test', sections: [] }
    expect(validate(page)).toEqual([])
  })
})
