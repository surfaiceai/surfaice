import type { SurfaicePage, Element } from '@surfaice/format'
import type { SurfaiceDiff, DiffElement, DiffChange } from './types.js'

type ElementEntry = { element: Element; section: string }

const COMPARED_FIELDS = [
  'type', 'label', 'action', 'result', 'navigates',
  'accepts', 'shows', 'current',
] as const

/**
 * Diff two SurfaicePage ASTs.
 * Returns a structured diff with added, removed, and changed elements.
 */
export function diff(expected: SurfaicePage, actual: SurfaicePage): SurfaiceDiff {
  const expectedMap = buildElementMap(expected)
  const actualMap = buildElementMap(actual)

  const added: DiffElement[] = []
  const removed: DiffElement[] = []
  const changed: DiffChange[] = []

  // Removed: in expected, not in actual
  for (const [id, { element, section }] of expectedMap) {
    if (!actualMap.has(id)) {
      removed.push({ id, type: element.type, label: element.label, section })
    }
  }

  // Added: in actual, not in expected
  for (const [id, { element, section }] of actualMap) {
    if (!expectedMap.has(id)) {
      added.push({ id, type: element.type, label: element.label, section })
    }
  }

  // Changed: in both, fields differ
  for (const [id, { element: exp, section }] of expectedMap) {
    const actEntry = actualMap.get(id)
    if (!actEntry) continue
    const act = actEntry.element

    // Compare scalar fields
    for (const field of COMPARED_FIELDS) {
      const expVal = String(exp[field] ?? '')
      const actVal = String(act[field] ?? '')
      if (expVal !== actVal && (expVal || actVal)) {
        changed.push({
          id, section, field,
          expected: expVal || '(none)',
          actual: actVal || '(none)',
        })
      }
    }

    // Compare attributes (as sorted comma-separated string)
    const expAttrs = [...(exp.attributes ?? [])].sort().join(', ')
    const actAttrs = [...(act.attributes ?? [])].sort().join(', ')
    if (expAttrs !== actAttrs) {
      changed.push({
        id, section, field: 'attributes',
        expected: expAttrs || '(none)',
        actual: actAttrs || '(none)',
      })
    }

    // Compare options
    const expOpts = [...(exp.options ?? [])].join(', ')
    const actOpts = [...(act.options ?? [])].join(', ')
    if (expOpts !== actOpts && (expOpts || actOpts)) {
      changed.push({
        id, section, field: 'options',
        expected: expOpts || '(none)',
        actual: actOpts || '(none)',
      })
    }
  }

  const status: 'match' | 'drift' =
    added.length === 0 && removed.length === 0 && changed.length === 0
      ? 'match'
      : 'drift'

  const parts: string[] = []
  if (added.length) parts.push(`${added.length} added`)
  if (removed.length) parts.push(`${removed.length} removed`)
  if (changed.length) parts.push(`${changed.length} changed`)
  const summary = status === 'match' ? 'No drift detected' : parts.join(', ')

  return { route: expected.route, status, added, removed, changed, summary }
}

function buildElementMap(page: SurfaicePage): Map<string, ElementEntry> {
  const map = new Map<string, ElementEntry>()
  for (const section of page.sections) {
    collectElements(section.elements, section.name, map)
  }
  return map
}

function collectElements(
  elements: Element[],
  section: string,
  map: Map<string, ElementEntry>,
): void {
  for (const el of elements) {
    map.set(el.id, { element: el, section })
    if (el.reveals?.length) {
      collectElements(el.reveals, section, map)
    }
  }
}
