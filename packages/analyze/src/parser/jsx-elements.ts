import {
  SourceFile,
  SyntaxKind,
  Node,
  JsxOpeningElement,
  JsxSelfClosingElement,
  JsxAttribute,
  JsxElement,
} from 'ts-morph'
import type { ExtractedElement, ElementType } from '../types.js'
import { resolveElementLabel } from './label-resolver.js'

/** Interactive JSX tags we care about */
const INTERACTIVE_TAGS = new Set([
  'input', 'textarea', 'select', 'button', 'a', 'Link', 'form',
])

/** Determine Surfaice ElementType from JSX tag + props */
function resolveType(tag: string, props: Record<string, string>): ElementType | null {
  switch (tag) {
    case 'input': {
      const t = (props['type'] ?? 'text').toLowerCase()
      if (t === 'checkbox') return 'checkbox'
      if (t === 'radio') return 'radio'
      // text, email, password, search, url, tel, number → textbox
      if (['text', 'email', 'password', 'search', 'url', 'tel', 'number'].includes(t)) return 'textbox'
      return null // hidden, file, submit, etc. — skip
    }
    case 'textarea': return 'textarea'
    case 'select': return 'select'
    case 'button': return 'button'
    case 'a':
    case 'Link': return 'link'
    default: return null
  }
}

/** Get string value of a JSX attribute (handles string literals and JSX expressions) */
function getPropStringValue(attr: JsxAttribute): string {
  const initializer = attr.getInitializer()
  if (!initializer) return 'true' // boolean prop like `required` or `disabled`
  const kind = initializer.getKind()
  if (kind === SyntaxKind.StringLiteral) {
    return initializer.getText().replace(/^["']|["']$/g, '')
  }
  if (kind === SyntaxKind.JsxExpression) {
    // Return the inner expression text (e.g. `{loading}` → "loading")
    const expr = (initializer as import('ts-morph').JsxExpression).getExpression()
    return expr ? expr.getText() : ''
  }
  return ''
}

/** Extract all props from a JSX opening/self-closing element as key→value string map */
function extractProps(node: JsxOpeningElement | JsxSelfClosingElement): Record<string, string> {
  const props: Record<string, string> = {}
  for (const attr of node.getAttributes()) {
    if (attr.getKind() === SyntaxKind.JsxAttribute) {
      const jsxAttr = attr as JsxAttribute
      const name = jsxAttr.getNameNode().getText()
      props[name] = getPropStringValue(jsxAttr)
    }
  }
  return props
}

/** Find the id of the nearest ancestor <form> element */
function findContainingFormId(node: Node): string | undefined {
  let current: Node | undefined = node.getParent()
  while (current) {
    const kind = current.getKind()
    if (kind === SyntaxKind.JsxElement) {
      const opening = (current as JsxElement).getOpeningElement()
      const tag = opening.getTagNameNode().getText()
      if (tag === 'form') {
        const formProps = extractProps(opening)
        return formProps['id']
      }
    }
    current = current.getParent()
  }
  return undefined
}

/** Counter for generating fallback element IDs */
let idCounter = 0

function generateId(tag: string, type: ElementType | null, index: number): string {
  if (type === 'link') return `link-${index}`
  if (type === 'button') return `btn-${index}`
  return `${tag}-${index}`
}

/** Extract all interactive elements from a source file */
export function extractElements(sourceFile: SourceFile): ExtractedElement[] {
  idCounter = 0
  const elements: ExtractedElement[] = []
  let elementIndex = 0

  // Collect both self-closing and opening elements
  const selfClosing = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
  const opening = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)

  const allNodes: Array<JsxSelfClosingElement | JsxOpeningElement> = [
    ...selfClosing,
    ...opening,
  ]

  // Sort by position for stable ordering
  allNodes.sort((a, b) => a.getStart() - b.getStart())

  for (const node of allNodes) {
    const tag = node.getTagNameNode().getText()

    if (!INTERACTIVE_TAGS.has(tag) || tag === 'form') continue

    const props = extractProps(node)
    const type = resolveType(tag, props)
    if (!type) continue

    const id = props['id'] ?? generateId(tag, type, elementIndex++)

    // Build attributes list
    const attributes: string[] = []
    if (props['required'] !== undefined) attributes.push('required')
    if (props['disabled'] !== undefined) attributes.push('disabled')
    if (props['readOnly'] !== undefined || props['readonly'] !== undefined) attributes.push('readonly')

    // For links, get href
    const navigatesTo = type === 'link' ? (props['href'] ?? undefined) : undefined

    const pos = sourceFile.getLineAndColumnAtPos(node.getStart())

    // Resolve label from all available sources
    const labelSource = resolveElementLabel(node, sourceFile)

    const element: ExtractedElement = {
      id,
      type,
      label: labelSource.value,
      attributes,
      jsxTag: tag,
      sourceLocation: {
        line: pos.line,
        column: pos.column,
      },
    }

    if (navigatesTo) element.navigatesTo = navigatesTo
    if (props['type']) element.inputType = props['type']

    const containingForm = findContainingFormId(node)
    if (containingForm) element.containingForm = containingForm

    elements.push(element)
  }

  return elements
}
