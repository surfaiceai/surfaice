# @surfaice/differ

Structural diff engine for Surfaice pages — compare two `SurfaicePage` ASTs and detect UI drift.

## Install

```bash
npm install @surfaice/differ @surfaice/format
```

## Usage

```typescript
import { diff } from '@surfaice/differ'
import { parse } from '@surfaice/format'

const expected = parse(committedMarkdown)
const actual = parse(liveMarkdown)

const result = diff(expected, actual)

if (result.status === 'drift') {
  console.log(result.summary)  // "2 added, 1 removed, 3 changed"
  result.added.forEach(el => console.log(`+ [${el.id}] ${el.label}`))
  result.removed.forEach(el => console.log(`- [${el.id}] ${el.label}`))
  result.changed.forEach(c => console.log(`~ [${c.id}].${c.field}: "${c.expected}" → "${c.actual}"`))
}
```

## What Gets Diffed

- **Added** — elements in actual but not in committed
- **Removed** — elements in committed but not in actual
- **Changed** — field-level diffs: `label`, `type`, `action`, `result`, `navigates`, `accepts`, `shows`, `current`, `attributes`, `options`
- **Nested** — elements inside `reveals` are diffed recursively
