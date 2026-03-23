import { SourceFile, SyntaxKind, Node } from 'ts-morph'
import type { SurfaiceTag } from '../types.js'

/**
 * Extract the name of a function/const declaration that a JSDoc comment
 * is attached to (the immediately following sibling node).
 */
function getFunctionName(commentNode: Node): string | undefined {
  const parent = commentNode.getParent()
  if (!parent) return undefined

  // The JSDoc comment is attached as a leading trivia to the next sibling.
  // In ts-morph, we look at the parent's children and find the first
  // FunctionDeclaration or VariableStatement after the comment.
  const siblings = parent.getChildren()
  let foundComment = false

  for (const sibling of siblings) {
    if (sibling === commentNode) {
      foundComment = true
      continue
    }
    if (!foundComment) continue

    const kind = sibling.getKind()

    // async function handleSubmit() {}
    if (kind === SyntaxKind.FunctionDeclaration) {
      return (sibling as import('ts-morph').FunctionDeclaration).getName() ?? undefined
    }

    // const handleSubmit = async () => {}
    if (kind === SyntaxKind.VariableStatement) {
      const decls = (sibling as import('ts-morph').VariableStatement).getDeclarations()
      if (decls.length > 0) return decls[0]?.getName() ?? undefined
    }
  }

  return undefined
}

/**
 * Parse fields string: "email, password" or "[email, password]" → ["email", "password"]
 */
function parseFields(raw: string): string[] {
  return raw
    .replace(/^\[|\]$/g, '') // strip [ ]
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

/**
 * Parse token block: "{ from: body, path: data.access_token }"
 */
function parseToken(raw: string): { from: string; path: string } | undefined {
  const fromMatch = raw.match(/from:\s*(\S+?)(?:,|\s*})/)
  const pathMatch = raw.match(/path:\s*(\S+?)(?:,|\s*})/)
  if (!fromMatch || !pathMatch) return undefined
  return {
    from: fromMatch[1]!.replace(/,$/, ''),
    path: pathMatch[1]!.replace(/,$/, ''),
  }
}

/**
 * Parse a single-line @surfaice action tag:
 * "action: POST /user/login, fields: [email, password], returns: access_token"
 */
function parseActionTag(text: string, functionName: string): SurfaiceTag {
  const tag: SurfaiceTag = { kind: 'action', functionName }

  // action: METHOD /path
  const actionMatch = text.match(/action:\s*([A-Z]+\s+\/[^\s,]+)/)
  if (actionMatch) tag.action = actionMatch[1]!.trim()

  // fields: [f1, f2, ...]
  const fieldsMatch = text.match(/fields:\s*(\[[^\]]*\]|[^,\]]+(?:,\s*[^,\]]+)*)/)
  if (fieldsMatch) tag.fields = parseFields(fieldsMatch[1]!)

  // returns: value
  const returnsMatch = text.match(/returns:\s*(\S+)/)
  if (returnsMatch) tag.returns = returnsMatch[1]!

  // confirms: value
  const confirmsMatch = text.match(/confirms:\s*(\S+)/)
  if (confirmsMatch) tag.confirms = confirmsMatch[1]!

  return tag
}

/**
 * Parse a multi-line @surfaice auth tag.
 * Lines like:
 *   login: POST /user/login
 *   fields: [email, password]
 *   token: { from: body, path: data.access_token }
 *   use: Authorization: Bearer {token}
 */
function parseAuthTag(text: string, functionName: string): SurfaiceTag {
  const tag: SurfaiceTag = { kind: 'auth', functionName }

  const loginMatch = text.match(/login:\s*([A-Z]+\s+\/[^\n]+)/)
  if (loginMatch) tag.login = loginMatch[1]!.trim()

  const fieldsMatch = text.match(/fields:\s*(\[[^\]]*\])/)
  if (fieldsMatch) tag.fields = parseFields(fieldsMatch[1]!)

  const tokenMatch = text.match(/token:\s*(\{[^}]+\})/)
  if (tokenMatch) tag.token = parseToken(tokenMatch[1]!)

  // use: everything until end of line
  const useMatch = text.match(/use:\s*(.+)/)
  if (useMatch) tag.use = useMatch[1]!.trim()

  return tag
}

/**
 * Find all JSDoc-style comments in a source file that contain @surfaice,
 * parse them, and return SurfaiceTag[].
 */
export function parseSurfaiceTags(sourceFile: SourceFile): SurfaiceTag[] {
  const results: SurfaiceTag[] = []
  const fullText = sourceFile.getFullText()

  // Match all /** ... */ blocks containing @surfaice
  const jsdocPattern = /\/\*\*([\s\S]*?)\*\//g
  let match: RegExpExecArray | null

  while ((match = jsdocPattern.exec(fullText)) !== null) {
    const commentContent = match[1] ?? ''

    if (!commentContent.includes('@surfaice')) continue

    // Clean up: strip leading * from each line
    const cleaned = commentContent
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(Boolean)
      .join('\n')

    // Find the function name by looking at what follows the comment in the AST
    const commentEnd = match.index + match[0].length
    const nodeAtEnd = sourceFile.getDescendantAtPos(commentEnd + 1)
    const functionName = nodeAtEnd
      ? (getFunctionNameFromContext(nodeAtEnd) ?? 'unknown')
      : 'unknown'

    // Determine tag kind
    const isAuth = /\@surfaice\s+auth/.test(cleaned)

    if (isAuth) {
      results.push(parseAuthTag(cleaned, functionName))
    } else {
      results.push(parseActionTag(cleaned, functionName))
    }
  }

  return results
}

/**
 * Walk up the AST from a node to find the nearest enclosing named declaration.
 */
function getFunctionNameFromContext(node: Node): string | undefined {
  let current: Node | undefined = node

  while (current) {
    const kind = current.getKind()

    if (kind === SyntaxKind.FunctionDeclaration) {
      return (current as import('ts-morph').FunctionDeclaration).getName() ?? undefined
    }

    if (kind === SyntaxKind.VariableDeclaration) {
      return (current as import('ts-morph').VariableDeclaration).getName()
    }

    if (kind === SyntaxKind.VariableStatement) {
      const decls = (current as import('ts-morph').VariableStatement).getDeclarations()
      return decls[0]?.getName() ?? undefined
    }

    current = current.getParent()
  }

  return undefined
}
