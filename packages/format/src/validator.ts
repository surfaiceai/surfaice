import type { SurfaicePage, Element, ValidationError } from './types.js'

const VALID_ELEMENT_TYPES = new Set([
  'button', 'textbox', 'textarea', 'link', 'select', 'checkbox',
  'radio', 'toggle', 'slider', 'image', 'image-upload',
  'badge', 'heading', 'text', 'list',
])

/**
 * Validate a SurfaicePage AST for structural correctness.
 * Returns an array of ValidationErrors — empty array means valid.
 */
export function validate(page: SurfaicePage): ValidationError[] {
  const errors: ValidationError[] = []

  // Collect all element IDs for duplicate and reference checking
  const allIds = new Set<string>()
  const seenIds = new Set<string>()

  // First pass: collect all element IDs (including in reveals)
  for (const section of page.sections) {
    collectIds(section.elements, allIds)
  }

  // Second pass: validate each element and check for duplicates
  for (let si = 0; si < page.sections.length; si++) {
    const section = page.sections[si]
    validateElements(section.elements, seenIds, errors, `sections[${si}]`)
  }

  // Validate capabilities reference existing element IDs
  if (page.capabilities) {
    for (let ci = 0; ci < page.capabilities.length; ci++) {
      const cap = page.capabilities[ci]
      for (const elementId of cap.elements) {
        if (!allIds.has(elementId)) {
          errors.push({
            code: 'UNKNOWN_ELEMENT_REF',
            message: `Capability "${cap.id}" references unknown element id "${elementId}"`,
            path: `capabilities[${ci}].elements`,
          })
        }
      }
    }
  }

  // Validate page state changes reference existing element IDs
  if (page.pageStates) {
    for (let psi = 0; psi < page.pageStates.length; psi++) {
      const state = page.pageStates[psi]
      for (let chi = 0; chi < state.changes.length; chi++) {
        const change = state.changes[chi]
        if (!allIds.has(change.elementId)) {
          errors.push({
            code: 'UNKNOWN_ELEMENT_REF',
            message: `State "${state.name}" references unknown element id "${change.elementId}"`,
            path: `pageStates[${psi}].changes[${chi}].elementId`,
          })
        }
      }
    }
  }

  return errors
}

function collectIds(elements: Element[], ids: Set<string>): void {
  for (const el of elements) {
    ids.add(el.id)
    if (el.reveals) {
      collectIds(el.reveals, ids)
    }
  }
}

function validateElements(
  elements: Element[],
  seenIds: Set<string>,
  errors: ValidationError[],
  path: string,
): void {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const elPath = `${path}.elements[${i}]`

    // Required fields
    if (!el.id) {
      errors.push({ code: 'MISSING_REQUIRED', message: 'Element is missing required field "id"', path: `${elPath}.id` })
    }
    if (!el.label) {
      errors.push({ code: 'MISSING_REQUIRED', message: 'Element is missing required field "label"', path: `${elPath}.label` })
    }

    // Valid type
    if (!VALID_ELEMENT_TYPES.has(el.type)) {
      errors.push({
        code: 'INVALID_TYPE',
        message: `Element "${el.id}" has invalid type "${el.type}". Valid types: ${[...VALID_ELEMENT_TYPES].join(', ')}`,
        path: `${elPath}.type`,
      })
    }

    // Unique ID
    if (el.id) {
      if (seenIds.has(el.id)) {
        errors.push({
          code: 'DUPLICATE_ID',
          message: `Duplicate element id "${el.id}" found at ${elPath}`,
          path: `${elPath}.id`,
        })
      } else {
        seenIds.add(el.id)
      }
    }

    // Recurse into reveals
    if (el.reveals) {
      validateElements(el.reveals, seenIds, errors, `${elPath}.reveals`)
    }
  }
}
