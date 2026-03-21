import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse } from '@surfaice/format'
import { diff } from '@surfaice/differ'
import type { SurfaiceDiff } from '@surfaice/differ'

export interface DiffOptions {
  dir: string
  baseUrl: string
  /** Output as JSON instead of human-readable text */
  json?: boolean
}

export interface DiffResult extends SurfaiceDiff {
  file: string
}

/**
 * Show structural diff between committed .surfaice.md files and the live app.
 * Returns array of diff results (one per file).
 */
export async function diffCommand(options: DiffOptions): Promise<DiffResult[]> {
  const files = readdirSync(options.dir)
    .filter((f: string) => f.endsWith('.surfaice.md'))

  const results: DiffResult[] = []

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
      continue
    }

    if (!response.ok) {
      console.error(`❌ ${route} — ${response.status} ${response.statusText}`)
      continue
    }

    const live = parse(await response.text())
    const result = diff(expected, live)
    results.push({ ...result, file })

    if (options.json) continue // collect silently for JSON output

    // Human-readable output
    const icon = result.status === 'match' ? '✅' : '❌'
    console.log(`${icon} ${route} — ${result.summary}`)
    for (const a of result.added)   console.log(`   + [${a.id}] ${a.type} "${a.label}" (${a.section})`)
    for (const r of result.removed) console.log(`   - [${r.id}] ${r.type} "${r.label}" (${r.section})`)
    for (const c of result.changed) console.log(`   ~ [${c.id}].${c.field}: "${c.expected}" → "${c.actual}"`)
  }

  if (options.json) {
    console.log(JSON.stringify(results, null, 2))
  }

  return results
}
