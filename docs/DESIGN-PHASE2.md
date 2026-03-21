# Phase 2 Technical Design — `@surfaice/next` + `@surfaice/differ` + `@surfaice/cli`

## Overview

Phase 2 ships the three packages that make Surfaice usable as a product:

1. **`@surfaice/next`** — Next.js middleware that serves `.surfaice.md` at runtime via `Accept: text/surfaice`
2. **`@surfaice/differ`** — Structural diff engine comparing two `SurfaicePage` ASTs
3. **`@surfaice/cli`** — CLI tool: `surfaice export`, `surfaice check`, `surfaice diff`

---

## Package 1: `@surfaice/next`

### Responsibility

Next.js middleware + plugin that:
1. Intercepts requests with `Accept: text/surfaice` header
2. Renders the page normally (collecting annotations via `@surfaice/react`)
3. Serializes the collected `SurfaicePage` AST to markdown
4. Returns the markdown response instead of HTML
5. Provides a dev overlay to toggle between HTML and markdown views

### Content Negotiation

The core principle: **same URL, same params, same auth — different Accept header.**

```
GET /settings
Accept: text/html          → normal HTML response
Accept: text/surfaice      → .surfaice.md response
```

No special routes, no query parameters. The middleware inspects the `Accept` header and routes accordingly.

### Middleware Architecture

```typescript
// How it integrates with Next.js

// next.config.ts
import { withSurfaice } from '@surfaice/next'

export default withSurfaice({
  // Master toggle — disable entirely in production if desired
  enabled: process.env.SURFAICE_ENABLED === 'true',

  // Optional: restrict which routes serve surfaice
  include: ['/settings', '/dashboard', '/profile'],
  // or
  exclude: ['/api', '/_next', '/static'],

  // Optional: auth gate
  auth: (req) => {
    const key = req.headers.get('x-surfaice-key')
    return key === process.env.SURFAICE_API_KEY
  },
})
```

### Implementation

```typescript
// packages/next/src/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export interface SurfaiceMiddlewareConfig {
  enabled?: boolean
  include?: string[]
  exclude?: string[]
  auth?: (req: NextRequest) => boolean | Promise<boolean>
}

export function createSurfaiceMiddleware(config: SurfaiceMiddlewareConfig = {}) {
  return async function surfaiceMiddleware(req: NextRequest) {
    // Check if Surfaice is enabled
    if (config.enabled === false) return NextResponse.next()

    // Check Accept header
    const accept = req.headers.get('accept') ?? ''
    if (!accept.includes('text/surfaice')) return NextResponse.next()

    // Check route inclusion/exclusion
    const pathname = req.nextUrl.pathname
    if (config.exclude?.some(p => pathname.startsWith(p))) return NextResponse.next()
    if (config.include && !config.include.some(p => pathname.startsWith(p))) return NextResponse.next()

    // Check auth
    if (config.auth) {
      const authed = await config.auth(req)
      if (!authed) {
        return new NextResponse('Unauthorized', { status: 401 })
      }
    }

    // Rewrite to our internal Surfaice render endpoint
    // This tells the page component to render in Surfaice mode
    const url = req.nextUrl.clone()
    url.searchParams.set('__surfaice', '1')
    const response = NextResponse.rewrite(url)
    response.headers.set('x-surfaice-mode', 'true')
    return response
  }
}
```

### Page-Level Integration

The tricky part: how does the middleware get the collected AST? Two approaches:

**Approach A: Server Component extraction (preferred for App Router)**

```typescript
// packages/next/src/SurfaiceRenderer.tsx
'use client'

import { useSurfaicePage } from '@surfaice/react'
import { serialize } from '@surfaice/format'
import { useSearchParams } from 'next/navigation'

export function SurfaiceRenderer() {
  const params = useSearchParams()
  const isSurfaice = params.get('__surfaice') === '1'
  const page = useSurfaicePage()

  if (!isSurfaice || !page) return null

  // In Surfaice mode, we need to send the markdown response
  // This component communicates the data to the middleware layer
  return (
    <script
      type="application/surfaice+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(page)
      }}
    />
  )
}
```

**Approach B: API Route handler (simpler, works with both App and Pages Router)**

```typescript
// packages/next/src/handler.ts

import { serialize } from '@surfaice/format'
import type { SurfaicePage } from '@surfaice/format'

// Registry of pages — populated at build time or on first render
const pageRegistry = new Map<string, () => SurfaicePage>()

export function registerSurfaicePage(route: string, factory: () => SurfaicePage) {
  pageRegistry.set(route, factory)
}

export async function handleSurfaiceRequest(pathname: string): Promise<string | null> {
  const factory = pageRegistry.get(pathname)
  if (!factory) return null
  const page = factory()
  return serialize(page)
}
```

**Recommendation: Start with Approach A** — it works with the existing `SurfaiceProvider` + `useSurfaicePage()` pattern from Phase 1. Approach B is better for production but requires a separate registration mechanism.

### withSurfaice Plugin

```typescript
// packages/next/src/plugin.ts

import type { NextConfig } from 'next'
import type { SurfaiceMiddlewareConfig } from './middleware'

export function withSurfaice(config: SurfaiceMiddlewareConfig = {}) {
  return (nextConfig: NextConfig = {}): NextConfig => {
    return {
      ...nextConfig,
      env: {
        ...nextConfig.env,
        __SURFAICE_ENABLED: config.enabled !== false ? 'true' : 'false',
      },
    }
  }
}
```

### Dev Overlay

A React component that shows a toggle panel in development:

```typescript
// packages/next/src/DevOverlay.tsx
'use client'

import { useState } from 'react'
import { useSurfaicePage } from '@surfaice/react'
import { serialize } from '@surfaice/format'

export function SurfaiceDevOverlay() {
  const [view, setView] = useState<'ui' | 'markdown' | 'diff'>('ui')
  const page = useSurfaicePage()

  if (process.env.NODE_ENV !== 'development') return null
  if (!page) return null

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 99999 }}>
      {/* Toggle buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setView('ui')}>🖥️ UI</button>
        <button onClick={() => setView('markdown')}>📄 Surfaice</button>
      </div>

      {/* Markdown panel */}
      {view === 'markdown' && (
        <pre style={{
          maxWidth: 500, maxHeight: 400, overflow: 'auto',
          background: '#1e1e1e', color: '#d4d4d4', padding: 16,
          borderRadius: 8, fontSize: 12,
        }}>
          {serialize(page)}
        </pre>
      )}
    </div>
  )
}
```

### Public API

```typescript
// @surfaice/next

export { withSurfaice } from './plugin'
export { createSurfaiceMiddleware } from './middleware'
export { SurfaiceDevOverlay } from './DevOverlay'
export { SurfaiceRenderer } from './SurfaiceRenderer'
export type { SurfaiceMiddlewareConfig } from './middleware'
```

### Dependencies

```json
{
  "dependencies": {
    "@surfaice/format": "workspace:*",
    "@surfaice/react": "workspace:*"
  },
  "peerDependencies": {
    "next": ">=14.0.0",
    "react": ">=18.0.0"
  }
}
```

### Test Plan

```
tests/
  middleware/
    accept-header.test.ts       # Routes text/surfaice vs text/html
    route-filtering.test.ts     # include/exclude patterns
    auth-gate.test.ts           # Auth callback
    disabled.test.ts            # Master toggle off
  dev-overlay/
    toggle.test.tsx             # Show/hide markdown panel
    serialize-display.test.tsx  # Correct output in panel
```

---

## Package 2: `@surfaice/differ`

### Responsibility

Compare two `SurfaicePage` ASTs and produce a structured diff. Used by:
- `surfaice check` — compare exported vs committed
- `surfaice diff` — show human-readable changes
- CI — detect UI regressions

### Diff Types

```typescript
interface SurfaiceDiff {
  route: string
  status: 'match' | 'drift'
  added: DiffElement[]       // in actual, not in expected
  removed: DiffElement[]     // in expected, not in actual
  changed: DiffChange[]      // exists in both, properties differ
  summary: string            // human-readable one-liner
}

interface DiffElement {
  id: string
  type: string
  label: string
  section: string
}

interface DiffChange {
  id: string
  section: string
  field: string             // which field changed: 'label', 'type', 'action', etc.
  expected: string
  actual: string
}
```

### Algorithm

```
1. Build element maps: id → Element for both expected and actual
2. Find added: IDs in actual not in expected
3. Find removed: IDs in expected not in actual
4. Find changed: IDs in both — compare each field
5. Also diff section structure (renamed, reordered, added, removed)
```

```typescript
// packages/differ/src/differ.ts

import type { SurfaicePage, Element } from '@surfaice/format'

export function diff(expected: SurfaicePage, actual: SurfaicePage): SurfaiceDiff {
  const expectedMap = buildElementMap(expected)
  const actualMap = buildElementMap(actual)

  const added: DiffElement[] = []
  const removed: DiffElement[] = []
  const changed: DiffChange[] = []

  // Find removed (in expected, not in actual)
  for (const [id, { element, section }] of expectedMap) {
    if (!actualMap.has(id)) {
      removed.push({ id, type: element.type, label: element.label, section })
    }
  }

  // Find added (in actual, not in expected)
  for (const [id, { element, section }] of actualMap) {
    if (!expectedMap.has(id)) {
      added.push({ id, type: element.type, label: element.label, section })
    }
  }

  // Find changed (in both, properties differ)
  for (const [id, { element: exp, section }] of expectedMap) {
    const act = actualMap.get(id)
    if (!act) continue

    const fields: (keyof Element)[] = [
      'type', 'label', 'action', 'result', 'navigates',
      'accepts', 'shows', 'current',
    ]

    for (const field of fields) {
      const expVal = String(exp[field] ?? '')
      const actVal = String(act.element[field] ?? '')
      if (expVal !== actVal && (expVal || actVal)) {
        changed.push({
          id, section, field,
          expected: expVal || '(none)',
          actual: actVal || '(none)',
        })
      }
    }

    // Compare attributes
    const expAttrs = (exp.attributes ?? []).join(', ')
    const actAttrs = (act.element.attributes ?? []).join(', ')
    if (expAttrs !== actAttrs) {
      changed.push({ id, section, field: 'attributes', expected: expAttrs || '(none)', actual: actAttrs || '(none)' })
    }
  }

  const status = (added.length === 0 && removed.length === 0 && changed.length === 0)
    ? 'match' : 'drift'

  const parts: string[] = []
  if (added.length) parts.push(`${added.length} added`)
  if (removed.length) parts.push(`${removed.length} removed`)
  if (changed.length) parts.push(`${changed.length} changed`)
  const summary = status === 'match' ? 'No drift detected' : parts.join(', ')

  return { route: expected.route, status, added, removed, changed, summary }
}

function buildElementMap(page: SurfaicePage): Map<string, { element: Element; section: string }> {
  const map = new Map<string, { element: Element; section: string }>()
  for (const section of page.sections) {
    collectElements(section.elements, section.name, map)
  }
  return map
}

function collectElements(
  elements: Element[],
  section: string,
  map: Map<string, { element: Element; section: string }>
): void {
  for (const el of elements) {
    map.set(el.id, { element: el, section })
    if (el.reveals) {
      collectElements(el.reveals, section, map)
    }
  }
}
```

### Public API

```typescript
// @surfaice/differ

export { diff } from './differ'
export type { SurfaiceDiff, DiffElement, DiffChange } from './types'
```

### Test Plan

```
tests/
  diff-added.test.ts          # Elements in actual not in expected
  diff-removed.test.ts        # Elements in expected not in actual
  diff-changed.test.ts        # Label, type, action, attributes changed
  diff-match.test.ts          # Identical pages → status: 'match'
  diff-reveals.test.ts        # Nested elements diffed correctly
  diff-sections.test.ts       # Section-level changes
```

---

## Package 3: `@surfaice/cli`

### Responsibility

CLI tool providing three commands:

```bash
surfaice export    # Generate .surfaice.md from a running Next.js app
surfaice check     # Compare exported vs committed files
surfaice diff      # Show human-readable changes
```

### Commands

#### `surfaice export`

Hits the running app with `Accept: text/surfaice` for each known route, saves the response as `.surfaice.md` files.

```typescript
// packages/cli/src/commands/export.ts

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

interface ExportOptions {
  baseUrl: string
  routes: string[]
  outDir: string       // default: 'surfaice/'
}

export async function exportCommand(options: ExportOptions): Promise<void> {
  mkdirSync(options.outDir, { recursive: true })

  for (const route of options.routes) {
    const url = new URL(route, options.baseUrl).toString()

    const response = await fetch(url, {
      headers: { 'Accept': 'text/surfaice' },
    })

    if (!response.ok) {
      console.error(`❌ ${route} — ${response.status} ${response.statusText}`)
      continue
    }

    const markdown = await response.text()
    const filename = route === '/'
      ? 'index.surfaice.md'
      : `${route.slice(1).replace(/\//g, '-')}.surfaice.md`
    const filepath = join(options.outDir, filename)

    mkdirSync(dirname(filepath), { recursive: true })
    writeFileSync(filepath, markdown)
    console.log(`✅ ${route} → ${filepath}`)
  }
}
```

#### `surfaice check`

Compares exported `.surfaice.md` files against committed versions. Exits non-zero on drift.

```typescript
// packages/cli/src/commands/check.ts

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse } from '@surfaice/format'
import { diff } from '@surfaice/differ'

interface CheckOptions {
  dir: string           // directory with .surfaice.md files
  baseUrl: string       // running app to check against
}

export async function checkCommand(options: CheckOptions): Promise<number> {
  const files = readdirSync(options.dir)
    .filter(f => f.endsWith('.surfaice.md'))

  let failures = 0

  for (const file of files) {
    const committed = readFileSync(join(options.dir, file), 'utf-8')
    const expected = parse(committed)

    // Fetch live version
    const route = fileToRoute(file)
    const url = new URL(route, options.baseUrl).toString()
    const response = await fetch(url, {
      headers: { 'Accept': 'text/surfaice' },
    })

    if (!response.ok) {
      console.error(`❌ ${route} — ${response.status}`)
      failures++
      continue
    }

    const live = parse(await response.text())
    const result = diff(expected, live)

    if (result.status === 'match') {
      console.log(`✅ ${route} — ${expected.sections.reduce((n, s) => n + s.elements.length, 0)} elements match`)
    } else {
      console.log(`❌ ${route} — DRIFT: ${result.summary}`)
      for (const a of result.added) console.log(`   + [${a.id}] ${a.type} "${a.label}"`)
      for (const r of result.removed) console.log(`   - [${r.id}] ${r.type} "${r.label}"`)
      for (const c of result.changed) console.log(`   ~ [${c.id}] ${c.field}: "${c.expected}" → "${c.actual}"`)
      failures++
    }
  }

  return failures > 0 ? 1 : 0
}
```

#### `surfaice diff`

Like `check` but outputs a structured diff (human-readable or JSON).

```typescript
// packages/cli/src/commands/diff.ts

export async function diffCommand(options: DiffOptions): Promise<void> {
  // Similar to check, but always shows the diff output
  // --json flag outputs machine-readable JSON
  // Default output is human-readable markdown-like diff
}
```

### CLI Entry Point

```typescript
// packages/cli/src/index.ts

#!/usr/bin/env node

import { Command } from 'commander'
import { exportCommand } from './commands/export'
import { checkCommand } from './commands/check'
import { diffCommand } from './commands/diff'

const program = new Command()
  .name('surfaice')
  .description('Surfaice CLI — manage UI manifests')
  .version('0.0.1')

program
  .command('export')
  .description('Export .surfaice.md files from a running app')
  .requiredOption('-u, --url <url>', 'Base URL of the running app')
  .option('-r, --routes <routes...>', 'Routes to export', ['/'])
  .option('-o, --out <dir>', 'Output directory', 'surfaice/')
  .action(async (opts) => {
    await exportCommand({ baseUrl: opts.url, routes: opts.routes, outDir: opts.out })
  })

program
  .command('check')
  .description('Check committed .surfaice.md files against live app')
  .requiredOption('-u, --url <url>', 'Base URL of the running app')
  .option('-d, --dir <dir>', 'Directory with .surfaice.md files', 'surfaice/')
  .action(async (opts) => {
    const exitCode = await checkCommand({ dir: opts.dir, baseUrl: opts.url })
    process.exit(exitCode)
  })

program
  .command('diff')
  .description('Show drift between committed and live UI')
  .requiredOption('-u, --url <url>', 'Base URL of the running app')
  .option('-d, --dir <dir>', 'Directory with .surfaice.md files', 'surfaice/')
  .option('--json', 'Output as JSON', false)
  .action(async (opts) => {
    await diffCommand({ dir: opts.dir, baseUrl: opts.url, json: opts.json })
  })

program.parse()
```

### Dependencies

```json
{
  "dependencies": {
    "@surfaice/format": "workspace:*",
    "@surfaice/differ": "workspace:*",
    "commander": "^12.0.0"
  },
  "bin": {
    "surfaice": "dist/index.js"
  }
}
```

### Test Plan

```
tests/
  commands/
    export.test.ts       # Fetches routes, writes files
    check.test.ts        # Compares committed vs live, exit codes
    diff.test.ts         # Diff output format (text + json)
  e2e/
    full-flow.test.ts    # Start test server → export → modify → check fails
```

---

## Build Order for Coder

```
Step 1:  @surfaice/differ — types + diff engine + tests
Step 2:  @surfaice/cli — export command
Step 3:  @surfaice/cli — check command (depends on differ)
Step 4:  @surfaice/cli — diff command
Step 5:  @surfaice/next — middleware (Accept header routing)
Step 6:  @surfaice/next — withSurfaice plugin
Step 7:  @surfaice/next — dev overlay
Step 8:  Integration test: Next.js app → surfaice export → surfaice check
```

Steps 1-4 can proceed independently of Steps 5-7. Step 8 ties everything together.

## Branch Convention

```
feature/differ-engine
feature/cli-export
feature/cli-check
feature/cli-diff
feature/next-middleware
feature/next-plugin
feature/next-dev-overlay
feature/phase2-integration
```
