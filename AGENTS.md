# AGENTS.md — Surfaice Development Guide

This file is for AI coding agents (Codex, Claude Code, Cursor, etc.) working on this codebase.

---

## What Is Surfaice?

Surfaice is an open standard that makes web UI machine-readable. Developers annotate their React components with `<ui.*>` wrappers. The app then serves a markdown description of its UI alongside the normal HTML — same URL, same auth, same data, just a different `Accept` header (`text/surfaice`).

**The core insight:** Your app already knows what's on each page. Surfaice just gives it a second output format.

**Three consumers, one source:**
- **Agents** request `Accept: text/surfaice` and get a live snapshot of the page in ~200 tokens
- **CI** exports static `.surfaice.md` files and diffs them to catch UI regressions
- **Humans** read `.surfaice.md` files in PRs as living UI documentation

---

## Project Structure

```
surfaice/
├── packages/
│   ├── format/        # .surfaice.md parser + serializer + validator
│   │   ├── src/
│   │   │   ├── types.ts       # Core AST types (SurfaicePage, Element, etc.)
│   │   │   ├── parser.ts      # Markdown → SurfaicePage AST
│   │   │   ├── serializer.ts  # SurfaicePage AST → Markdown
│   │   │   ├── validator.ts   # AST validation (unique IDs, valid types, etc.)
│   │   │   └── index.ts       # Public API: parse, serialize, validate
│   │   └── tests/
│   ├── react/         # React annotation components
│   │   ├── src/
│   │   │   ├── provider.ts    # SurfaiceProvider context
│   │   │   ├── components.ts  # ui.page, ui.section, ui.element
│   │   │   ├── hooks.ts       # useSurfaicePage()
│   │   │   └── index.ts       # Public API
│   │   └── tests/
│   ├── next/          # Next.js middleware + dev overlay + build export
│   ├── differ/        # Structural diff engine (compare two SurfaicePage ASTs)
│   ├── cli/           # CLI: surfaice export, check, diff
│   └── action/        # GitHub Action wrapper
├── spec/
│   └── FORMAT.md      # The .surfaice.md format specification (the standard)
├── docs/
│   ├── SPEC.md        # Product specification
│   └── DESIGN-PHASE1.md  # Technical design for format + react packages
├── examples/
│   └── todo-app.surfaice.md  # Example manifest
├── AGENTS.md          # ← You are here
├── CONTRIBUTING.md
├── README.md
└── package.json       # Root — pnpm monorepo + turborepo
```

---

## Overall Architecture

```
Developer writes React components
  with <ui.page>, <ui.section>, <ui.element> annotations
          │
          ▼
  @surfaice/react — collects annotations via React context
          │
          ├──→ Runtime: @surfaice/next middleware
          │    Intercepts requests with Accept: text/surfaice
          │    Serializes annotations → markdown (with live data)
          │    Returns as response
          │
          └──→ Build time: @surfaice/cli export
               Serializes annotations → static .surfaice.md files
               Committed to repo, diffed in CI
```

### Key Design Principles

1. **Same URL, different format** — No special routes. `Accept: text/surfaice` header toggles output. Same auth, same params, same data.

2. **Zero production overhead** — `<ui.*>` components render only their children. Annotation collection only activates when Surfaice is enabled.

3. **Annotations are the single source of truth** — No external crawlers. No separate config files to maintain. The annotations in your code ARE the manifest.

4. **The format is the product** — `.surfaice.md` is a valid Markdown file. It renders in GitHub, in VSCode, anywhere. The format is designed to become a web standard.

5. **Runtime data, not templates** — When serving to agents, values are live (`current: "Jane Doe"`), not template placeholders (`current: {user.name}`). Agents see reality.

---

## The .surfaice.md Format

A `.surfaice.md` file is valid Markdown with a specific structure:

```markdown
---
surfaice: v1
route: /settings
---

# /settings

## Profile Section
- [name] textbox "Display Name" → current: "Jane Doe"
- [email] textbox "Email" (readonly) → shows: "jane@example.com"
- [save] button "Save Changes" → PUT /api/profile → toast "Saved!"

## Danger Zone
- [delete] button "Delete Account" (destructive) → DELETE /api/account → confirms: modal

## States
- [loading]: [save] disabled, shows spinner
- [error]: inline-error below [save] "Failed to save"
```

### Element syntax: `- [id] type "Label" (attrs) → action → result`

See `spec/FORMAT.md` for the full specification.

---

## Core Types

All packages share the types defined in `@surfaice/format`:

```typescript
SurfaicePage           # Top-level: route, sections, capabilities, states
  ├── Section          # UI section: name + elements
  │   └── Element      # Interactive element: id, type, label, action, value...
  │       └── Element  # Nested (via reveals)
  ├── Capability       # Named user intent: id, description, element IDs
  └── PageState        # UI state variant: name, changes
      └── StateChange  # Per-element change: modifier (+/-/~), description
```

---

## Development Flow

### Setup

```bash
git clone https://github.com/surfaiceai/surfaice.git
cd surfaice
pnpm install
pnpm build
pnpm test
```

### Branching

- `main` is protected — no direct pushes, PRs require approval
- Branch naming: `feature/<package>-<description>` (e.g., `feature/format-parser`)
- One PR per logical unit of work

### Build Order (Phase 1)

```
Step 1: @surfaice/format types           ✅ PR #1
Step 2: @surfaice/format parser          ← next
Step 3: @surfaice/format serializer
Step 4: @surfaice/format validator
Step 5: @surfaice/react provider + context
Step 6: @surfaice/react ui.* components
Step 7: @surfaice/react hooks
Step 8: Integration tests
```

Each step is a separate PR. Steps 1–4 can be developed independently. Steps 5–7 depend on format types.

---

## Testing

### Philosophy: TDD (Test-Driven Development)

**Write tests first, then implement.** Every PR must include tests.

```bash
# Run all tests
pnpm test

# Run tests for a specific package
cd packages/format && pnpm test

# Run tests in watch mode during development
cd packages/format && npx vitest watch
```

### Test Structure

Each package follows this pattern:

```
packages/<name>/
  src/          # Source code
  tests/        # Test files, mirroring src/ structure
    fixtures/   # .surfaice.md files used as test inputs
```

### What to Test

- **Parser:** Input markdown → expected AST. Use fixture files from `tests/fixtures/`.
- **Serializer:** Input AST → expected markdown string. Test roundtrip: `parse(serialize(ast))` must equal `ast`.
- **Validator:** Valid and invalid ASTs → expected errors.
- **React components:** Annotation collection via context. Verify passthrough rendering (zero overhead when disabled).
- **Integration:** Full flow — annotated React component → serialized `.surfaice.md` output.

### Test Naming Convention

```typescript
describe('parseElementLine', () => {
  it('parses a simple button element', () => { ... })
  it('parses element with attributes', () => { ... })
  it('parses element with action and result', () => { ... })
  it('returns null for non-element lines', () => { ... })
})
```

---

## Coding Standards

### TypeScript

- Strict mode enabled
- No `any` — use proper types
- Export types explicitly from `index.ts`
- JSDoc comments on all public interfaces and functions

### Dependencies

- Keep dependencies minimal
- `@surfaice/format` depends on: `unified`, `remark-parse`, `remark-frontmatter`, `yaml`
- `@surfaice/react` depends on: `@surfaice/format` + peer deps on `react`, `react-dom`
- Testing: `vitest` for all packages

### Package Conventions

- Each package has its own `package.json`, `tsconfig.json`
- Build output goes to `dist/`
- Public API is defined in `src/index.ts` — only export what consumers need
- Internal utilities stay unexported

---

## Key Decisions Log

| Decision | Choice | Reason |
|----------|--------|--------|
| Format | Markdown-based (`.surfaice.md`) | Human-readable, git-diffable, renders in GitHub |
| Content negotiation | `Accept: text/surfaice` header | Same URL as HTML, no special routes |
| Runtime data | Live values, not templates | Agents need reality, not placeholders |
| Framework | React first (Next.js) | Largest vibe coder audience |
| Monorepo | pnpm + turborepo | Standard for multi-package TypeScript projects |
| Testing | vitest + TDD | Fast, modern, TypeScript-native |
| License | MIT | Maximum adoption, standard-setting intent |
| No crawler | Framework annotations only | Lossless, always in sync, no AI guessing |

---

## Common Pitfalls

- **Don't add framework-specific code to `@surfaice/format`** — it's the shared core, must stay framework-agnostic
- **Don't import React in `@surfaice/format`** — format has no React dependency
- **Roundtrip stability matters** — `parse(serialize(parse(input)))` must equal `parse(input)`. If it doesn't, the serializer is lossy.
- **Element IDs must be unique per page** — the validator enforces this, tests should cover it
- **The `<ui.*>` components must be zero-overhead when disabled** — always verify passthrough rendering in tests
