# @surfaice/format

Parser, serializer, and validator for the `.surfaice.md` format — the machine-readable UI description used by [Surfaice](https://github.com/surfaiceai/surfaice).

## Install

```bash
npm install @surfaice/format
```

## Usage

```typescript
import { parse, serialize, validate } from '@surfaice/format'

// Parse a .surfaice.md file
const page = parse(markdownString)  // → SurfaicePage AST

// Validate structure
const errors = validate(page)       // → ValidationError[]

// Serialize back to markdown
const md = serialize(page)          // → string (roundtrip stable)
```

## What Is `.surfaice.md`?

A markdown-based format that describes your UI elements for AI agents and CI tools:

```markdown
---
surfaice: v1
route: /settings
states: [auth-required]
---

# /settings

## Profile
- [name] textbox "Display Name" → current: {user.name} → accepts: string
- [save] button "Save Changes" (destructive) → PUT /api/profile → toast 'Saved!'
```

## API

### `parse(markdown: string): SurfaicePage`
### `serialize(page: SurfaicePage): string`
### `validate(page: SurfaicePage): ValidationError[]`

## Part of Surfaice

- [`@surfaice/react`](../react) — React annotations
- [`@surfaice/differ`](../differ) — Structural diff engine
- [`@surfaice/cli`](../cli) — CLI tools
- [`@surfaice/next`](../next) — Next.js middleware
