import { SourceFile, SyntaxKind, JsxOpeningElement, JsxSelfClosingElement, JsxAttribute } from 'ts-morph'
import type { SurfaiceTag, ExtractedElement, MappedAction } from '../types.js'

/**
 * Get the string value of a JSX prop (handles string literals and {expr} references).
 */
function getJsxPropValue(node: JsxOpeningElement | JsxSelfClosingElement, propName: string): string | undefined {
  for (const attr of node.getAttributes()) {
    if (attr.getKind() !== SyntaxKind.JsxAttribute) continue
    const jsxAttr = attr as JsxAttribute
    if (jsxAttr.getNameNode().getText() !== propName) continue
    const init = jsxAttr.getInitializer()
    if (!init) return 'true'
    if (init.getKind() === SyntaxKind.StringLiteral) {
      return init.getText().replace(/^["']|["']$/g, '')
    }
    if (init.getKind() === SyntaxKind.JsxExpression) {
      const expr = (init as import('ts-morph').JsxExpression).getExpression()
      return expr?.getText() ?? ''
    }
  }
  return undefined
}

/**
 * Extract all router.push('/path') paths from a function body in the source text.
 * Returns the first found path, e.g. "/dashboard".
 */
function extractRouterPush(sourceText: string, functionName: string): string | undefined {
  // Find the function body range by looking for the function declaration
  // Simple heuristic: scan for router.push('/...') after the function starts
  const fnIdx = sourceText.indexOf(`function ${functionName}`)
  const constIdx = sourceText.indexOf(`${functionName} =`)
  const startIdx = fnIdx !== -1 ? fnIdx : constIdx !== -1 ? constIdx : -1
  if (startIdx === -1) return undefined

  // Slice from function start
  const slice = sourceText.slice(startIdx, startIdx + 2000)
  const pushMatch = slice.match(/router\.push\(['"]([^'"]+)['"]\)/)
  return pushMatch ? pushMatch[1] : undefined
}

/**
 * Find the submit button within a form (by containingForm id) or the first submit-type button.
 */
function findSubmitButton(
  elements: ExtractedElement[],
  formId?: string
): ExtractedElement | undefined {
  if (formId) {
    // First look for a button inside the specific form
    const inForm = elements.filter(e => e.type === 'button' && e.containingForm === formId)
    if (inForm.length > 0) return inForm[0]
  }
  // Fall back to first button with type="submit" or first button overall
  const submitBtn = elements.find(e => e.type === 'button' && e.inputType === 'submit')
  return submitBtn ?? elements.find(e => e.type === 'button')
}

/**
 * Find the form element whose onSubmit prop references the given function name.
 */
function findFormByOnSubmit(
  functionName: string,
  sourceFile: SourceFile
): { formId?: string } | undefined {
  const openingForms = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
    .filter(n => n.getTagNameNode().getText() === 'form')

  for (const form of openingForms) {
    const onSubmit = getJsxPropValue(form, 'onSubmit')
    if (onSubmit === functionName) {
      const formId = getJsxPropValue(form, 'id')
      return { formId }
    }
  }
  return undefined
}

/**
 * Find a button whose onClick prop references the given function name.
 */
function findButtonByOnClick(
  functionName: string,
  elements: ExtractedElement[],
  sourceFile: SourceFile
): ExtractedElement | undefined {
  const buttons = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
    .filter(n => n.getTagNameNode().getText() === 'button')

  for (const btn of buttons) {
    const onClick = getJsxPropValue(btn, 'onClick')
    if (onClick === functionName) {
      const btnId = getJsxPropValue(btn, 'id')
      if (btnId) return elements.find(e => e.id === btnId)
    }
  }

  // Also check self-closing buttons
  const selfClosingBtns = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .filter(n => n.getTagNameNode().getText() === 'button')
  for (const btn of selfClosingBtns) {
    const onClick = getJsxPropValue(btn, 'onClick')
    if (onClick === functionName) {
      const btnId = getJsxPropValue(btn, 'id')
      if (btnId) return elements.find(e => e.id === btnId)
    }
  }

  return undefined
}

/**
 * Map @surfaice JSDoc action tags to extracted JSX elements.
 *
 * Strategy:
 * 1. Direct match: functionName → onSubmit={functionName} form → submit button in that form
 * 2. onClick match: functionName → onClick={functionName} button
 * 3. Proximity fallback: first submit button in the file
 */
export function mapActionsToElements(
  tags: SurfaiceTag[],
  elements: ExtractedElement[],
  sourceFile: SourceFile
): MappedAction[] {
  const results: MappedAction[] = []
  const sourceText = sourceFile.getFullText()

  for (const tag of tags) {
    if (tag.kind !== 'action') continue
    if (!tag.action) continue

    const functionName = tag.functionName ?? 'unknown'

    let triggerElement: ExtractedElement | undefined

    // Strategy 1: form onSubmit
    const formMatch = findFormByOnSubmit(functionName, sourceFile)
    if (formMatch !== undefined) {
      triggerElement = findSubmitButton(elements, formMatch.formId)
    }

    // Strategy 2: button onClick
    if (!triggerElement) {
      triggerElement = findButtonByOnClick(functionName, elements, sourceFile)
    }

    // Strategy 3: proximity fallback — first submit button in file
    if (!triggerElement) {
      triggerElement = findSubmitButton(elements)
    }

    if (!triggerElement) continue // no trigger found, skip (warning would go here)

    // Detect result from router.push in the function body
    const pushPath = extractRouterPush(sourceText, functionName)
    const result = pushPath ? `navigates: ${pushPath}` : undefined

    results.push({
      elementId: triggerElement.id,
      action: tag.action,
      fields: tag.fields ?? [],
      ...(result ? { result } : {}),
    })
  }

  return results
}
