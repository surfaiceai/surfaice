import { describe, it, expect } from 'vitest'
import { validate } from '../../src/validator'
import type { SurfaicePage } from '../../src/types'

describe('validate — capabilities', () => {
  it('passes when capability references valid element IDs', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/test',
      capabilities: [{ id: 'update', description: 'Update', elements: ['name', 'save'] }],
      sections: [{ name: 'S', elements: [
        { id: 'name', type: 'textbox', label: 'Name' },
        { id: 'save', type: 'button', label: 'Save' },
      ]}],
    }
    expect(validate(page)).toEqual([])
  })

  it('errors when capability references unknown element ID', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/test',
      capabilities: [{ id: 'update', description: 'Update', elements: ['name', 'nonexistent'] }],
      sections: [{ name: 'S', elements: [
        { id: 'name', type: 'textbox', label: 'Name' },
      ]}],
    }
    const errors = validate(page)
    expect(errors.some(e => e.code === 'UNKNOWN_ELEMENT_REF')).toBe(true)
    expect(errors[0].message).toContain('nonexistent')
  })

  it('passes when no capabilities defined', () => {
    const page: SurfaicePage = {
      version: 'v1', route: '/test',
      sections: [{ name: 'S', elements: [{ id: 'name', type: 'textbox', label: 'Name' }] }],
    }
    expect(validate(page)).toEqual([])
  })
})
