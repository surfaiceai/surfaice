import { describe, it, expect } from 'vitest'
import type {
  ElementType,
  Element,
  Section,
  SurfaicePage,
  Capability,
  PageState,
  StateChange,
  ValidationError,
} from '../../src/types'

describe('ElementType', () => {
  it('covers all expected element types', () => {
    const types: ElementType[] = [
      'button', 'textbox', 'textarea', 'link',
      'select', 'checkbox', 'radio', 'toggle',
      'slider', 'image', 'image-upload',
      'badge', 'heading', 'text', 'list',
    ]
    expect(types).toHaveLength(15)
  })
})

describe('Element', () => {
  it('requires id, type, and label', () => {
    const el: Element = {
      id: 'save',
      type: 'button',
      label: 'Save Changes',
    }
    expect(el.id).toBe('save')
    expect(el.type).toBe('button')
    expect(el.label).toBe('Save Changes')
  })

  it('supports all optional fields', () => {
    const el: Element = {
      id: 'name',
      type: 'textbox',
      label: 'Display Name',
      attributes: ['required'],
      action: 'PUT /api/profile',
      result: "toast 'Saved!'",
      navigates: '/dashboard',
      reveals: [],
      value: 'Haosu Wu',
      current: '{user.name}',
      accepts: 'string',
      options: ['Light', 'Dark', 'System'],
      shows: '{notifications.count}',
    }
    expect(el.attributes).toEqual(['required'])
    expect(el.action).toBe('PUT /api/profile')
    expect(el.value).toBe('Haosu Wu')
    expect(el.current).toBe('{user.name}')
    expect(el.options).toHaveLength(3)
  })

  it('supports nested reveals', () => {
    const child: Element = { id: 'child-input', type: 'textbox', label: 'Extra Input' }
    const parent: Element = {
      id: 'toggle',
      type: 'toggle',
      label: 'Show More',
      reveals: [child],
    }
    expect(parent.reveals).toHaveLength(1)
    expect(parent.reveals![0].id).toBe('child-input')
  })
})

describe('Section', () => {
  it('has name and elements', () => {
    const section: Section = {
      name: 'Profile',
      elements: [{ id: 'name', type: 'textbox', label: 'Display Name' }],
    }
    expect(section.name).toBe('Profile')
    expect(section.elements).toHaveLength(1)
  })
})

describe('SurfaicePage', () => {
  it('requires version, route, and sections', () => {
    const page: SurfaicePage = {
      version: 'v1',
      route: '/settings',
      sections: [],
    }
    expect(page.version).toBe('v1')
    expect(page.route).toBe('/settings')
    expect(page.sections).toEqual([])
  })

  it('supports all optional fields', () => {
    const page: SurfaicePage = {
      version: 'v1',
      route: '/settings',
      name: 'Settings Page',
      states: ['auth-required'],
      capabilities: [
        { id: 'update-profile', description: 'User updates display name', elements: ['name', 'save'] },
      ],
      sections: [],
      pageStates: [
        {
          name: 'loading',
          changes: [{ elementId: 'save', modifier: '~', description: 'disabled, shows spinner' }],
        },
      ],
    }
    expect(page.name).toBe('Settings Page')
    expect(page.states).toEqual(['auth-required'])
    expect(page.capabilities).toHaveLength(1)
    expect(page.pageStates).toHaveLength(1)
  })
})

describe('StateChange', () => {
  it('supports all three modifiers', () => {
    const add: StateChange = { elementId: 'x', modifier: '+', description: 'show spinner' }
    const remove: StateChange = { elementId: 'x', modifier: '-', description: 'hide button' }
    const modify: StateChange = { elementId: 'x', modifier: '~', description: 'change label' }
    expect(add.modifier).toBe('+')
    expect(remove.modifier).toBe('-')
    expect(modify.modifier).toBe('~')
  })
})

describe('ValidationError', () => {
  it('has code and message', () => {
    const err: ValidationError = {
      code: 'DUPLICATE_ID',
      message: 'Element id "save" is not unique',
      path: 'sections[0].elements[1].id',
    }
    expect(err.code).toBe('DUPLICATE_ID')
    expect(err.path).toBeDefined()
  })
})
