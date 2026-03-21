import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import { parse as parseYaml } from 'yaml'
import type { Root, Heading, List, ListItem, Paragraph, Text } from 'mdast'
import type {
  SurfaicePage,
  Section,
  Element,
  ElementType,
  Capability,
  PageState,
  StateChange,
} from './types'

// Regex to match element lines: - [id] type "Label" (attrs) → ...
const ELEMENT_LINE_RE = /^-\s+\[(\w[\w-]*)\]\s+(\w[\w-]*)\s+"([^"]+)"(?:\s+\(([^)]+)\))?(.*)?$/

/**
 * Parse a .surfaice.md string into a SurfaicePage AST.
 */
export function parse(input: string): SurfaicePage {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])

  const mdast = processor.parse(input) as Root

  // Extract frontmatter
  const frontmatterNode = mdast.children.find(n => n.type === 'yaml') as ({ type: 'yaml'; value: string }) | undefined
  const frontmatter = frontmatterNode ? parseYaml(frontmatterNode.value) as Record<string, unknown> : {}

  const version = String(frontmatter['surfaice'] ?? 'v1')
  const route = String(frontmatter['route'] ?? '/')
  const name = frontmatter['name'] ? String(frontmatter['name']) : undefined
  const states = Array.isArray(frontmatter['states']) ? (frontmatter['states'] as unknown[]).map(String) : undefined
  const capabilities = parseCapabilities(frontmatter['capabilities'])

  // Walk the AST and collect sections + page states
  const sections: Section[] = []
  let pageStates: PageState[] | undefined

  let currentSection: Section | null = null
  let inStatesBlock = false

  for (const node of mdast.children) {
    if (node.type === 'yaml') continue

    if (node.type === 'heading') {
      const heading = node as Heading
      const headingText = extractText(heading)

      if (heading.depth === 1) {
        // Page heading — skip
        currentSection = null
        inStatesBlock = false
        continue
      }

      if (heading.depth === 2) {
        if (headingText === 'States') {
          inStatesBlock = true
          currentSection = null
        } else {
          inStatesBlock = false
          currentSection = { name: headingText, elements: [] }
          sections.push(currentSection)
        }
        continue
      }
    }

    if (node.type === 'list') {
      const list = node as List
      if (inStatesBlock) {
        pageStates = parseStatesBlock(list)
      } else if (currentSection) {
        const elements = parseElementList(list)
        currentSection.elements.push(...elements)
      }
    }
  }

  return {
    version,
    route,
    ...(name !== undefined && { name }),
    ...(states !== undefined && { states }),
    ...(capabilities !== undefined && { capabilities }),
    sections,
    ...(pageStates !== undefined && { pageStates }),
  }
}

function parseCapabilities(raw: unknown): Capability[] | undefined {
  if (!Array.isArray(raw)) return undefined
  return (raw as unknown[]).map((cap) => {
    const c = cap as Record<string, unknown>
    return {
      id: String(c['id'] ?? ''),
      description: String(c['description'] ?? ''),
      elements: Array.isArray(c['elements']) ? (c['elements'] as unknown[]).map(String) : [],
    }
  })
}

function extractText(node: Heading): string {
  return node.children
    .filter((c): c is Text => c.type === 'text')
    .map(c => c.value)
    .join('')
}

function extractListItemText(item: ListItem): string {
  const para = item.children.find((c): c is Paragraph => c.type === 'paragraph')
  if (!para) return ''
  return para.children
    .filter((c): c is Text => c.type === 'text')
    .map(c => c.value)
    .join('')
}

function parseElementList(list: List): Element[] {
  const elements: Element[] = []

  for (const item of list.children) {
    const listItem = item as ListItem
    const text = extractListItemText(listItem)
    const el = parseElementLine(text)
    if (!el) continue

    // Check for nested list (reveals)
    const nestedList = listItem.children.find((c): c is List => c.type === 'list')
    if (nestedList) {
      el.reveals = parseElementList(nestedList)
    }

    elements.push(el)
  }

  return elements
}

function parseElementLine(line: string): Element | null {
  const trimmed = line.trim().startsWith('- ') ? line.trim() : `- ${line.trim()}`
  const match = trimmed.match(ELEMENT_LINE_RE)
  if (!match) return null

  const [, id, type, label, attrs, rest] = match

  const element: Element = {
    id,
    type: type as ElementType,
    label,
  }

  if (attrs) {
    element.attributes = attrs.split(',').map(a => a.trim()).filter(Boolean)
  }

  if (rest && rest.trim()) {
    parseActions(rest.trim(), element)
  }

  return element
}

function parseActions(text: string, element: Element): void {
  // Split on → (unicode arrow) or ASCII →
  const parts = text.split(/\s*→\s*/).map(p => p.trim()).filter(Boolean)

  for (const part of parts) {
    if (part.startsWith('navigates:')) {
      element.navigates = part.slice('navigates:'.length).trim()
    } else if (part.startsWith('current:')) {
      element.current = part.slice('current:'.length).trim()
    } else if (part.startsWith('accepts:')) {
      element.accepts = part.slice('accepts:'.length).trim()
    } else if (part.startsWith('shows:')) {
      element.shows = part.slice('shows:'.length).trim()
    } else if (part.startsWith('options:')) {
      element.options = part.slice('options:'.length).trim().split(',').map(o => o.trim()).filter(Boolean)
    } else if (part.startsWith('reveals:')) {
      // reveals children are parsed from nested list, not inline
    } else if (/^(GET|POST|PUT|PATCH|DELETE)\s/.test(part)) {
      element.action = part
    } else if (part.startsWith('toast') || part.startsWith('confirms:') || part.startsWith('inline-error')) {
      element.result = part
    } else {
      // Fallback: first unknown part → action, second → result
      if (!element.action) {
        element.action = part
      } else if (!element.result) {
        element.result = part
      }
    }
  }
}

function parseStatesBlock(list: List): PageState[] {
  const states: PageState[] = []

  for (const item of list.children) {
    const text = extractListItemText(item as ListItem).trim()

    // Format: [state-name]: modifier elementId description
    const stateMatch = text.match(/^\[([^\]]+)\]:\s*([+\-~])\s+(\w[\w-]*)\s+(.*)$/)
    if (!stateMatch) continue

    const [, stateName, modifier, elementId, description] = stateMatch

    const change: StateChange = {
      elementId,
      modifier: modifier as '+' | '-' | '~',
      description: description.trim(),
    }

    // Check if we already have this state
    const existing = states.find(s => s.name === stateName)
    if (existing) {
      existing.changes.push(change)
    } else {
      states.push({ name: stateName, changes: [change] })
    }
  }

  return states.length > 0 ? states : []
}
