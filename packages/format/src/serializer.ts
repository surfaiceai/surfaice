import type { SurfaicePage, Section, Element } from './types.js'

/**
 * Serialize a SurfaicePage AST back to a .surfaice.md string.
 * Guarantees roundtrip stability: parse(serialize(page)) deepEquals page.
 */
export function serialize(page: SurfaicePage): string {
  const lines: string[] = []

  // Frontmatter
  lines.push('---')
  lines.push(`surfaice: ${page.version}`)
  lines.push(`route: ${page.route}`)

  if (page.name !== undefined) {
    lines.push(`name: ${page.name}`)
  }

  if (page.states?.length) {
    lines.push(`states: [${page.states.join(', ')}]`)
  }

  if (page.capabilities?.length) {
    lines.push('capabilities:')
    for (const cap of page.capabilities) {
      lines.push(`  - id: ${cap.id}`)
      lines.push(`    description: "${cap.description}"`)
      lines.push(`    elements: [${cap.elements.join(', ')}]`)
    }
  }

  lines.push('---')
  lines.push('')

  // Page heading
  lines.push(`# ${page.route}`)

  // Sections
  for (const section of page.sections) {
    lines.push('')
    lines.push(`## ${section.name}`)
    for (const el of section.elements) {
      lines.push(serializeElement(el, 0))
    }
  }

  // Page states
  if (page.pageStates?.length) {
    lines.push('')
    lines.push('## States')
    for (const state of page.pageStates) {
      for (const change of state.changes) {
        lines.push(`- [${state.name}]: ${change.modifier} ${change.elementId} ${change.description}`)
      }
    }
  }

  return lines.join('\n') + '\n'
}

function serializeElement(el: Element, indent: number): string {
  const prefix = '  '.repeat(indent) + '- '
  let line = `${prefix}[${el.id}] ${el.type} "${el.label}"`

  if (el.attributes?.length) {
    line += ` (${el.attributes.join(', ')})`
  }

  const parts: string[] = []

  // Order matters for roundtrip stability — must match parser's parseActions order
  if (el.current !== undefined) parts.push(`current: ${el.current}`)
  if (el.accepts !== undefined) parts.push(`accepts: ${el.accepts}`)
  if (el.options?.length) parts.push(`options: ${el.options.join(', ')}`)
  if (el.shows !== undefined) parts.push(`shows: ${el.shows}`)
  if (el.action !== undefined) parts.push(el.action)
  if (el.result !== undefined) parts.push(el.result)
  if (el.navigates !== undefined) parts.push(`navigates: ${el.navigates}`)

  if (el.reveals?.length) {
    parts.push('reveals:')
    line += parts.length > 0 ? ' → ' + parts.join(' → ') : ''
    for (const child of el.reveals) {
      line += '\n' + serializeElement(child, indent + 1)
    }
    return line
  }

  if (parts.length > 0) {
    line += ' → ' + parts.join(' → ')
  }

  return line
}
