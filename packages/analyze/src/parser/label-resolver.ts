import {
  SourceFile,
  SyntaxKind,
  Node,
  JsxOpeningElement,
  JsxSelfClosingElement,
  JsxAttribute,
  JsxElement,
  CallExpression,
} from 'ts-morph'

export type LabelSourceKind =
  | 'aria-label'
  | 'htmlFor'
  | 'children'
  | 'placeholder'
  | 'title'
  | 'id'
  | 'i18n-key'

export interface LabelSource {
  value: string
  source: LabelSourceKind
}

type JsxNode = JsxOpeningElement | JsxSelfClosingElement

/** Get string value of a JsxAttribute (string literals only) */
function getStringProp(node: JsxNode, name: string): string | undefined {
  for (const attr of node.getAttributes()) {
    if (attr.getKind() !== SyntaxKind.JsxAttribute) continue
    const jsxAttr = attr as JsxAttribute
    if (jsxAttr.getNameNode().getText() !== name) continue
    const init = jsxAttr.getInitializer()
    if (!init) return undefined
    if (init.getKind() === SyntaxKind.StringLiteral) {
      return init.getText().replace(/^["']|["']$/g, '')
    }
  }
  return undefined
}

/** Capitalize first letter of a string: "email" → "Email" */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Extract i18n key from a call like t('key') or t("key") */
function extractI18nKey(call: CallExpression): string | undefined {
  const args = call.getArguments()
  if (args.length === 0) return undefined
  const first = args[0]
  if (!first) return undefined
  const kind = first.getKind()
  if (kind === SyntaxKind.StringLiteral) {
    return first.getText().replace(/^["']|["']$/g, '')
  }
  return undefined
}

/**
 * Try to extract a label from JSX children text / i18n calls.
 * Returns the label and whether it's an i18n key.
 */
function extractChildrenLabel(jsxElement: JsxElement): LabelSource | undefined {
  const children = jsxElement.getJsxChildren()

  for (const child of children) {
    const kind = child.getKind()

    // Plain text: <button>Sign In</button>
    if (kind === SyntaxKind.JsxText) {
      const text = child.getText().trim()
      if (text) return { value: text, source: 'children' }
      continue
    }

    // JSX expression: <button>{t('signIn')}</button> or ternary
    if (kind === SyntaxKind.JsxExpression) {
      const expr = (child as import('ts-morph').JsxExpression).getExpression()
      if (!expr) continue

      // Direct call: t('key')
      if (expr.getKind() === SyntaxKind.CallExpression) {
        const key = extractI18nKey(expr as CallExpression)
        if (key) return { value: key, source: 'i18n-key' }
        continue
      }

      // Ternary: loading ? t('signingIn') : t('signIn')
      if (expr.getKind() === SyntaxKind.ConditionalExpression) {
        const cond = expr as import('ts-morph').ConditionalExpression
        // Prefer the "false" branch (non-loading state) if it looks like loading?
        const condition = cond.getCondition().getText()
        const isLoadingCondition = /\bload(ing)?\b/i.test(condition)

        const whenFalse = cond.getWhenFalse()
        const whenTrue = cond.getWhenTrue()

        // If condition looks like a loading check, prefer the false (non-loading) branch
        const preferred = isLoadingCondition ? whenFalse : whenTrue

        if (preferred.getKind() === SyntaxKind.CallExpression) {
          const key = extractI18nKey(preferred as CallExpression)
          if (key) return { value: key, source: 'i18n-key' }
        }

        // Fallback: try the other branch
        const fallback = isLoadingCondition ? whenTrue : whenFalse
        if (fallback.getKind() === SyntaxKind.CallExpression) {
          const key = extractI18nKey(fallback as CallExpression)
          if (key) return { value: key, source: 'i18n-key' }
        }
      }
    }
  }

  return undefined
}

/**
 * Find a <label htmlFor="id"> in the source file and return its text content.
 */
function findHtmlForLabel(id: string, sourceFile: SourceFile): string | undefined {
  const labelElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
    .filter(n => n.getTagNameNode().getText() === 'label')

  for (const labelOpen of labelElements) {
    const forProp = getStringProp(labelOpen, 'htmlFor')
    if (forProp !== id) continue

    // Get the parent JsxElement to read children
    const parent = labelOpen.getParent()
    if (parent?.getKind() === SyntaxKind.JsxElement) {
      const text = (parent as JsxElement)
        .getJsxChildren()
        .map(c => c.getText().trim())
        .filter(Boolean)
        .join('')
      if (text) return text
    }
  }
  return undefined
}

/**
 * Resolve the best available label for a JSX element.
 *
 * Priority:
 * 1. aria-label prop
 * 2. htmlFor association (find <label htmlFor="id">)
 * 3. Text children / i18n keys
 * 4. placeholder prop
 * 5. title prop
 * 6. id prop (capitalized)
 */
export function resolveElementLabel(
  node: JsxNode,
  sourceFile: SourceFile
): LabelSource {
  // 1. aria-label
  const ariaLabel = getStringProp(node, 'aria-label')
  if (ariaLabel) return { value: ariaLabel, source: 'aria-label' }

  // 2. htmlFor association
  const id = getStringProp(node, 'id')
  if (id) {
    const htmlForText = findHtmlForLabel(id, sourceFile)
    if (htmlForText) return { value: htmlForText, source: 'htmlFor' }
  }

  // 3. Children text / i18n (only applies to JsxElement, not self-closing)
  const parent = node.getParent()
  if (parent?.getKind() === SyntaxKind.JsxElement) {
    const childrenLabel = extractChildrenLabel(parent as JsxElement)
    if (childrenLabel) return childrenLabel
  }

  // 4. placeholder
  const placeholder = getStringProp(node, 'placeholder')
  if (placeholder) return { value: placeholder, source: 'placeholder' }

  // 5. title
  const title = getStringProp(node, 'title')
  if (title) return { value: title, source: 'title' }

  // 6. id as fallback (capitalize)
  if (id) return { value: capitalize(id), source: 'id' }

  return { value: '', source: 'id' }
}
