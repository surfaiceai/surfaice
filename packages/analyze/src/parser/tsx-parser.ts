import { Project } from 'ts-morph'
import { extractElements } from './jsx-elements.js'
import type { ParsedPage } from '../types.js'

/**
 * Detect auth guard pattern: file uses useAuth/AuthContext AND calls router.push('/login').
 * Heuristic — works for CoTale and similar patterns.
 */
function detectAuthGuard(text: string): boolean {
  const hasAuthHook = text.includes('useAuth') || text.includes('AuthContext')
  const hasLoginRedirect = text.includes("router.push('/login')")
  return hasAuthHook && hasLoginRedirect
}

/**
 * Detect the default export component name from source text.
 * Handles: `export default function Foo`, `export default class Foo`,
 * and `const Foo = ...; export default Foo`.
 */
function detectComponentName(text: string): string {
  // export default function ComponentName
  const funcMatch = text.match(/export\s+default\s+function\s+(\w+)/)
  if (funcMatch) return funcMatch[1] ?? 'UnknownComponent'

  // export default class ComponentName
  const classMatch = text.match(/export\s+default\s+class\s+(\w+)/)
  if (classMatch) return classMatch[1] ?? 'UnknownComponent'

  return 'UnknownComponent'
}

/**
 * Parse a TSX file and extract a ParsedPage with elements, imports, and metadata.
 *
 * @param filePath - Absolute path to the page.tsx file
 * @param route    - Normalized route string, e.g. "/login"
 * @param project  - Shared ts-morph Project instance (caller manages lifecycle)
 */
export function parseTsxFile(filePath: string, route: string, project: Project): ParsedPage {
  const sourceFile = project.addSourceFileAtPath(filePath)
  const text = sourceFile.getFullText()

  // Collect import module specifiers
  const imports = sourceFile
    .getImportDeclarations()
    .map(d => d.getModuleSpecifierValue())

  return {
    route,
    filePath,
    elements: extractElements(sourceFile),
    imports,
    hasAuthGuard: detectAuthGuard(text),
    componentName: detectComponentName(text),
  }
}
