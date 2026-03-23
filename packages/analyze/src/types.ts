import type { SurfaicePage } from '@surfaice/format'
export type { SurfaicePage }

// ─── Route Discovery ────────────────────────────────────────────────────────

export interface DiscoveredRoute {
  /** Normalized route path, e.g. "/login", "/novels/:id" */
  route: string
  /** Absolute path to the page.tsx file */
  filePath: string
  /** Route segments after locale stripping, e.g. ["login"] or ["dashboard", "settings"] */
  segments: string[]
  /** Dynamic param names, e.g. ["id"] for /novels/[id] */
  dynamicParams: string[]
  /** Heuristic: true if no auth redirect detected in this file */
  isPublic: boolean
}

export interface DiscoveryOptions {
  /** Path to the Next.js app/ directory */
  appDir: string
  /** Strip [locale] segment from routes (default: true) */
  stripLocale?: boolean
  /** Route segment patterns to exclude (default: ["api"]) */
  exclude?: string[]
}

// ─── Element Extraction ──────────────────────────────────────────────────────

export type ElementType =
  | 'textbox'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'select'
  | 'button'
  | 'link'

export interface ExtractedElement {
  /** Element id from `id` prop, or auto-generated (e.g. "email-input") */
  id: string
  /** Surfaice element type */
  type: ElementType
  /** Resolved human-readable label */
  label: string
  /** Semantic attributes: "required", "disabled", "readonly", "destructive" */
  attributes: string[]
  /** For links: href value */
  navigatesTo?: string
  /** For inputs: type attribute value (e.g. "email", "password") */
  inputType?: string
  /** Id of the containing form element, if any */
  containingForm?: string
  /** Original JSX tag name: "input", "button", "Link" */
  jsxTag: string
  /** Source location for debugging */
  sourceLocation: {
    line: number
    column: number
  }
}

export interface ParsedPage {
  /** Normalized route path */
  route: string
  /** Absolute path to the source file */
  filePath: string
  /** All extracted interactive elements */
  elements: ExtractedElement[]
  /** Imported module specifiers */
  imports: string[]
  /** True if auth redirect pattern detected (useAuth + router.push('/login')) */
  hasAuthGuard: boolean
  /** Default export component name, e.g. "LoginPage" */
  componentName: string
}

// ─── JSDoc Tags ──────────────────────────────────────────────────────────────

export interface SurfaiceTag {
  /** Tag kind: action describes an API call, auth describes the login flow */
  kind: 'action' | 'auth'
  /** Name of the function this JSDoc is attached to, e.g. "handleSubmit" */
  functionName?: string
  /** HTTP action string, e.g. "POST /user/login" */
  action?: string
  /** Form field ids submitted with this action */
  fields?: string[]
  /** Return value description, e.g. "access_token" */
  returns?: string
  /** Confirmation UI type, e.g. "modal" */
  confirms?: string
  // Auth-specific fields
  login?: string
  token?: { from: string; path: string }
  use?: string
}

export interface MappedAction {
  /** Element id that triggers this action */
  elementId: string
  /** HTTP action string, e.g. "POST /user/login" */
  action: string
  /** Field ids involved in this action */
  fields: string[]
  /** Result description, e.g. "navigates: /dashboard" */
  result?: string
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

export interface AnalyzeOptions {
  /** Path to the Next.js app/ directory */
  appDir: string
  /** Output directory for .surfaice.md files (default: "surfaice/") */
  outDir?: string
  /** Strip [locale] segment from routes (default: true) */
  stripLocale?: boolean
  /** Route segment patterns to exclude */
  exclude?: string[]
  /** Specific routes to analyze — omit for all routes */
  routes?: string[]
  /** Print output without writing files (default: false) */
  dryRun?: boolean
}

export interface PageResult {
  route: string
  filePath: string
  /** Parsed AST — needed by differ and validation tools */
  manifest: SurfaicePage
  /** Serialized .surfaice.md string */
  markdown: string
  elementCount: number
  warnings: string[]
}

export interface AnalyzeResult {
  pages: PageResult[]
  totalRoutes: number
  totalElements: number
  warnings: string[]
}
