import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse } from '@surfaice/format'
import { diff } from '@surfaice/differ'
import { routeToFilename } from './export.js'

export interface CheckOptions {
  /** Directory containing committed .surfaice.md files */
  dir: string
  /** Base URL of the running app */
  baseUrl: string
}

/**
 * Compare committed .surfaice.md files against the live app.
 * Returns 0 on success (no drift), 1 on any failures or drift.
 */
export async function checkCommand(options: CheckOptions): Promise<number> {
  const files = readdirSync(options.dir)
    .filter((f: string) => f.endsWith('.surfaice.md'))

  let failures = 0

  for (const file of files) {
    const committed = readFileSync(join(options.dir, file), 'utf-8')
    const expected = parse(committed)
    const route = expected.route

    let response: Response
    try {
      response = await fetch(new URL(route, options.baseUrl).toString(), {
        headers: { 'Accept': 'text/surfaice' },
      })
    } catch (err) {
      console.error(`❌ ${route} — Network error: ${String(err)}`)
      failures++
      continue
    }

    if (!response.ok) {
      console.error(`❌ ${route} — ${response.status} ${response.statusText}`)
      failures++
      continue
    }

    const live = parse(await response.text())
    const result = diff(expected, live)

    if (result.status === 'match') {
      const elementCount = expected.sections.reduce((n, s) => n + s.elements.length, 0)
      console.log(`✅ ${route} — ${elementCount} elements match`)
    } else {
      console.log(`❌ ${route} — DRIFT: ${result.summary}`)
      for (const a of result.added)   console.log(`   + [${a.id}] ${a.type} "${a.label}"`)
      for (const r of result.removed) console.log(`   - [${r.id}] ${r.type} "${r.label}"`)
      for (const c of result.changed) console.log(`   ~ [${c.id}] ${c.field}: "${c.expected}" → "${c.actual}"`)
      failures++
    }
  }

  return failures > 0 ? 1 : 0
}
