# Phase 1 Technical Design — `@surfaice/format` + `@surfaice/react`

## Overview

Phase 1 ships the two foundational packages that everything else builds on:

1. **`@surfaice/format`** — Parser and serializer for `.surfaice.md` files
2. **`@surfaice/react`** — React annotation components that collect UI structure at runtime

These must ship together — React annotations produce the data, the format package serializes it.

---

## Package 1: `@surfaice/format`

### Responsibility

Parse `.surfaice.md` → AST (structured data), and serialize AST → `.surfaice.md` (markdown text).

### AST Types

```typescript
// Core types — the data model everything shares

interface SurfaicePage {
  version: string              // "v1"
  route: string                // "/settings"
  name?: string                // "Settings Page"
  states?: string[]            // ["auth-required"]
  capabilities?: Capability[]
  sections: Section[]
  pageStates?: PageState[]     // the ## States block
}

interface Capability {
  id: string                   // "update-profile"
  description: string          // "User updates their display name"
  elements: string[]           // ["name", "save"]
}

interface Section {
  name: string                 // "Profile Section"
  elements: Element[]
}

interface Element {
  id: string                   // "name"
  type: ElementType            // "textbox"
  label: string                // "Display Name"
  attributes?: string[]        // ["readonly", "required", "destructive"]
  action?: string              // "PUT /api/profile"
  result?: string              // "toast 'Saved!'"
  navigates?: string           // "/dashboard"
  reveals?: Element[]          // nested elements shown on interaction
  value?: string               // runtime value: "Haosu Wu" or template: "{user.name}"
  accepts?: string             // input type hint: "email", "string"
  options?: string[]           // for select: ["Light", "Dark", "System"]
  shows?: string               // for display elements: "{user.email}"
  current?: string             // current value binding: "{user.name}"
}

type ElementType =
  | 'button' | 'textbox' | 'textarea' | 'link'
  | 'select' | 'checkbox' | 'radio' | 'toggle'
  | 'slider' | 'image' | 'image-upload'
  | 'badge' | 'heading' | 'text' | 'list'

interface PageState {
  name: string                 // "loading"
  changes: StateChange[]
}

interface StateChange {
  elementId: string            // "save"
  modifier: '+' | '-' | '~'   // add, remove, change
  description: string          // "disabled, shows spinner"
}
```

### Parser Design

The parser works in two stages:

```
.surfaice.md text
      ↓
  Stage 1: Markdown → Markdown AST (using remark/unified)
      ↓
  Stage 2: Markdown AST → SurfaicePage (custom transformer)
```

**Stage 1** uses the battle-tested `unified` + `remark-parse` + `remark-frontmatter` ecosystem. No custom markdown syntax — we parse standard markdown structures (headings, lists, nested lists).

**Stage 2** is our custom transformer that walks the markdown AST and extracts:
- YAML frontmatter → `version`, `route`, `states`, `capabilities`
- `## Heading` → `Section`
- `- [id] type "Label" ...` → `Element` (this is the core parser)

### Element Line Parser

The most important piece — parsing a single element line:

```
- [save] button "Save Changes" (destructive) → PUT /api/profile → toast "Saved!"
```

Regex-based tokenizer:

```typescript
// Simplified — actual implementation handles edge cases
function parseElementLine(line: string): Element | null {
  const match = line.match(
    /^-\s+\[(\w[\w-]*)\]\s+(\w[\w-]*)\s+"([^"]+)"(?:\s+\(([^)]+)\))?(.*)$/
  )
  if (!match) return null

  const [, id, type, label, attrs, rest] = match

  const element: Element = {
    id,
    type: type as ElementType,
    label,
  }

  if (attrs) {
    element.attributes = attrs.split(',').map(a => a.trim())
  }

  // Parse arrow-separated actions: → action → result
  if (rest) {
    parseActions(rest.trim(), element)
  }

  return element
}

function parseActions(text: string, element: Element): void {
  // Split on → and parse each segment
  const parts = text.split('→').map(p => p.trim()).filter(Boolean)

  for (const part of parts) {
    if (part.startsWith('navigates:')) {
      element.navigates = part.replace('navigates:', '').trim()
    } else if (part.startsWith('toast') || part.startsWith('shows:')) {
      element.result = part
    } else if (part.startsWith('reveals:')) {
      // Handled by nested list parsing, not inline
    } else if (part.startsWith('current:')) {
      element.current = part.replace('current:', '').trim()
    } else if (part.startsWith('accepts:')) {
      element.accepts = part.replace('accepts:', '').trim()
    } else if (part.startsWith('options:')) {
      element.options = part.replace('options:', '').trim().split(',').map(o => o.trim())
    } else if (part.match(/^(GET|POST|PUT|PATCH|DELETE)\s/)) {
      element.action = part
    } else if (part.startsWith('confirms:')) {
      element.result = part
    } else {
      // Fallback: treat as action or result based on position
      if (!element.action) element.action = part
      else element.result = part
    }
  }
}
```

### Serializer Design

AST → markdown string. Straightforward template generation:

```typescript
function serialize(page: SurfaicePage): string {
  const lines: string[] = []

  // Frontmatter
  lines.push('---')
  lines.push(`surfaice: ${page.version}`)
  lines.push(`route: ${page.route}`)
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
  lines.push(`# ${page.route}`)

  // Sections
  for (const section of page.sections) {
    lines.push('')
    lines.push(`## ${section.name}`)
    for (const el of section.elements) {
      lines.push(serializeElement(el, 0))
    }
  }

  // States
  if (page.pageStates?.length) {
    lines.push('')
    lines.push('## States')
    for (const state of page.pageStates) {
      for (const change of state.changes) {
        lines.push(`- [${state.name}]: ${change.modifier === '+' ? '+ ' : change.modifier === '-' ? '- ' : ''}${change.description}`)
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
  if (el.current) parts.push(`current: ${el.current}`)
  if (el.accepts) parts.push(`accepts: ${el.accepts}`)
  if (el.options) parts.push(`options: ${el.options.join(', ')}`)
  if (el.shows) parts.push(`shows: ${el.shows}`)
  if (el.action) parts.push(el.action)
  if (el.result) parts.push(el.result)
  if (el.navigates) parts.push(`navigates: ${el.navigates}`)

  if (parts.length) {
    line += ' → ' + parts.join(' → ')
  }

  let result = line
  if (el.reveals?.length) {
    result += ' → reveals:'
    for (const child of el.reveals) {
      result += '\n' + serializeElement(child, indent + 1)
    }
  }

  return result
}
```

### Public API

```typescript
// @surfaice/format

export { parse } from './parser'
export { serialize } from './serializer'
export { validate } from './validator'
export type { SurfaicePage, Section, Element, Capability, PageState } from './types'

// Usage:
import { parse, serialize, validate } from '@surfaice/format'

const page = parse(markdownString)    // string → SurfaicePage
const md = serialize(page)            // SurfaicePage → string
const errors = validate(page)         // SurfaicePage → ValidationError[]
```

### Validator

Checks structural correctness:
- All element IDs unique within a page
- Element types are valid `ElementType` values
- Capability `elements` arrays reference existing element IDs
- Required fields present (`id`, `type`, `label`)
- State changes reference existing element IDs

### Dependencies

```json
{
  "dependencies": {
    "unified": "^11.0.0",
    "remark-parse": "^11.0.0",
    "remark-frontmatter": "^5.0.0",
    "yaml": "^2.4.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "typescript": "^5.5.0"
  }
}
```

### Test Plan

```
tests/
  parser/
    parse-frontmatter.test.ts      # YAML frontmatter extraction
    parse-sections.test.ts         # ## heading → Section
    parse-elements.test.ts         # Element line parsing (the big one)
    parse-reveals.test.ts          # Nested element lists
    parse-states.test.ts           # ## States block
    parse-full-page.test.ts        # End-to-end: full .surfaice.md → AST
  serializer/
    serialize-elements.test.ts     # Element → markdown line
    serialize-full-page.test.ts    # AST → .surfaice.md
    roundtrip.test.ts              # parse(serialize(page)) === page
  validator/
    validate-ids.test.ts           # Unique IDs, valid references
    validate-types.test.ts         # Valid element types
  fixtures/
    todo-app.surfaice.md           # Real example from repo
    settings-page.surfaice.md      # Settings with states
    simple-page.surfaice.md        # Minimal example
```

**Critical test: roundtrip stability** — `parse(serialize(parse(input)))` must equal `parse(input)`. This guarantees the format is lossless.

---

## Package 2: `@surfaice/react`

### Responsibility

React components that:
1. **In production**: render children with zero overhead (passthrough)
2. **When Surfaice is active**: collect UI structure annotations and expose them as a `SurfaicePage` AST

### Architecture

```
<SurfaiceProvider enabled={true}>     ← Context provider, master toggle
  <ui.page route="/settings">         ← Registers page in context
    <ui.section name="Profile">       ← Registers section
      <ui.element id="name" ...>      ← Registers element
        <input ... />                 ← Actual UI (always rendered)
      </ui.element>
    </ui.section>
  </ui.page>
</SurfaiceProvider>
```

### Context + Registry

```typescript
// Internal context — collects annotations at runtime

interface SurfaiceContext {
  enabled: boolean
  currentPage: SurfaicePage | null
  registerPage: (page: Partial<SurfaicePage>) => void
  registerSection: (section: Partial<Section>) => void
  registerElement: (element: Partial<Element>) => void
  getPage: () => SurfaicePage | null
}

const SurfaiceContext = createContext<SurfaiceContext>({
  enabled: false,
  currentPage: null,
  registerPage: () => {},
  registerSection: () => {},
  registerElement: () => {},
  getPage: () => null,
})
```

### Provider Component

```typescript
interface SurfaiceProviderProps {
  enabled?: boolean
  children: React.ReactNode
}

export function SurfaiceProvider({
  enabled = false,
  children
}: SurfaiceProviderProps) {
  const registryRef = useRef<SurfaiceRegistry>(new SurfaiceRegistry())

  const ctx = useMemo(() => ({
    enabled,
    get currentPage() { return registryRef.current.page },
    registerPage: (p) => registryRef.current.setPage(p),
    registerSection: (s) => registryRef.current.addSection(s),
    registerElement: (e) => registryRef.current.addElement(e),
    getPage: () => registryRef.current.toSurfaicePage(),
  }), [enabled])

  return (
    <SurfaiceContext.Provider value={ctx}>
      {children}
    </SurfaiceContext.Provider>
  )
}
```

### Annotation Components

```typescript
// ui.page — wraps a page
interface UIPageProps {
  route: string
  name?: string
  states?: string[]
  capabilities?: Capability[]
  children: React.ReactNode
}

function UIPage({ route, name, states, capabilities, children }: UIPageProps) {
  const ctx = useContext(SurfaiceContext)

  useEffect(() => {
    if (ctx.enabled) {
      ctx.registerPage({ route, name, states, capabilities, version: 'v1' })
    }
  }, [ctx.enabled, route, name])

  return <>{children}</>   // Always just renders children
}

// ui.section — wraps a section
interface UISectionProps {
  name: string
  children: React.ReactNode
}

function UISection({ name, children }: UISectionProps) {
  const ctx = useContext(SurfaiceContext)

  useEffect(() => {
    if (ctx.enabled) {
      ctx.registerSection({ name })
    }
  }, [ctx.enabled, name])

  return <>{children}</>
}

// ui.element — wraps an interactive element
interface UIElementProps {
  id: string
  type: ElementType
  label: string
  attributes?: string[]
  action?: string
  result?: string
  navigates?: string
  value?: string | number        // runtime value — injected into markdown
  current?: string
  accepts?: string
  options?: string[]
  shows?: string | number        // runtime display value
  reveals?: boolean              // marks this as a reveals: parent
  children: React.ReactNode
}

function UIElement({
  children,
  value,
  shows,
  ...props
}: UIElementProps) {
  const ctx = useContext(SurfaiceContext)

  useEffect(() => {
    if (ctx.enabled) {
      ctx.registerElement({
        ...props,
        // Inject runtime values — this is where compile-time meets runtime
        value: value !== undefined ? String(value) : props.current,
        shows: shows !== undefined ? String(shows) : undefined,
      })
    }
  }, [ctx.enabled, value, shows, props.id])

  return <>{children}</>
}

// Export as ui namespace
export const ui = {
  page: UIPage,
  section: UISection,
  element: UIElement,
}
```

### Runtime Data Injection

The key insight — `value` and `shows` props accept live runtime data:

```tsx
// value={user.name} is evaluated at render time
// The annotation captures "Haosu Wu", not "{user.name}"
<ui.element id="name" type="textbox" label="Display Name"
  value={user.name}           // → runtime: "Haosu Wu"
  current="{user.name}"       // → template: "{user.name}" (for static export)
  action="PUT /api/profile">
  <input value={user.name} />
</ui.element>
```

**Runtime mode** (serving to agents): uses `value` → `current: "Haosu Wu"`
**Build/static mode** (export to file): uses `current` → `current: {user.name}`

### Extracting the Page Data

```typescript
// Hook for middleware/dev tools to get the collected page data
export function useSurfaicePage(): SurfaicePage | null {
  const ctx = useContext(SurfaiceContext)
  return ctx.getPage()
}

// For server-side extraction (Next.js middleware)
export function getSurfaiceData(registry: SurfaiceRegistry): SurfaicePage | null {
  return registry.toSurfaicePage()
}
```

### Public API

```typescript
// @surfaice/react

export { SurfaiceProvider } from './provider'
export { ui } from './components'
export { useSurfaicePage } from './hooks'
export type { UIPageProps, UISectionProps, UIElementProps } from './components'
```

### Dependencies

```json
{
  "dependencies": {
    "@surfaice/format": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "vitest": "^2.0.0",
    "typescript": "^5.5.0"
  }
}
```

### Test Plan

```
tests/
  components/
    ui-page.test.tsx           # Page registration
    ui-section.test.tsx        # Section registration
    ui-element.test.tsx        # Element registration + value injection
    passthrough.test.tsx       # Verify zero overhead when disabled
  integration/
    full-page.test.tsx         # Annotated page → SurfaicePage AST
    runtime-values.test.tsx    # Live data injection into elements
    serialize-output.test.tsx  # Annotated page → .surfaice.md string
  provider/
    enabled-toggle.test.tsx    # Enable/disable behavior
    nested-context.test.tsx    # Multiple pages/sections
```

---

## Build Order for Coder

```
Step 1: @surfaice/format types (types.ts)
Step 2: @surfaice/format parser (parser.ts + tests)
Step 3: @surfaice/format serializer (serializer.ts + roundtrip tests)
Step 4: @surfaice/format validator (validator.ts + tests)
Step 5: @surfaice/react context + provider
Step 6: @surfaice/react ui.* components
Step 7: @surfaice/react hooks (useSurfaicePage)
Step 8: Integration test: annotated React page → .surfaice.md output
```

Each step is a PR. Steps 1–4 can merge independently. Steps 5–7 depend on format types.

## Branch Convention

```
feature/format-types
feature/format-parser
feature/format-serializer
feature/format-validator
feature/react-provider
feature/react-components
feature/react-hooks
feature/integration-tests
```
