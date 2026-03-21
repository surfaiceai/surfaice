/**
 * @surfaice/action — GitHub Action entry point
 */

import { readFileSync, readdirSync, existsSync, appendFileSync } from 'fs'
import { join } from 'path'
import { parse } from '@surfaice/format'
import { diff } from '@surfaice/differ'
import type { SurfaiceDiff } from '@surfaice/differ'

function getInput(name: string, defaultValue: string = ''): string {
  const envName = `INPUT_${name.toUpperCase().replace(/-/g, '_')}`
  return process.env[envName] ?? defaultValue
}

function setOutput(name: string, value: string): void {
  const outputFile = process.env.GITHUB_OUTPUT
  if (outputFile) {
    appendFileSync(outputFile, `${name}=${value}\n`)
  }
  console.log(`::set-output name=${name}::${value}`)
}

async function run(): Promise<void> {
  const baseUrl = getInput('base-url')
  const surfaiceDir = getInput('surfaice-dir', 'surfaice/')
  const failOnDrift = getInput('fail-on-drift', 'true') !== 'false'

  if (!baseUrl) {
    console.error('::error::base-url input is required')
    process.exit(1)
  }

  if (!existsSync(surfaiceDir)) {
    console.error(`::error::Directory not found: ${surfaiceDir}`)
    process.exit(1)
  }

  const files = readdirSync(surfaiceDir).filter((f: string) => f.endsWith('.surfaice.md'))

  if (files.length === 0) {
    console.log(`::warning::No .surfaice.md files found in ${surfaiceDir}`)
    setOutput('drift-detected', 'false')
    setOutput('drift-summary', 'No .surfaice.md files found')
    return
  }

  const diffs: (SurfaiceDiff & { file: string })[] = []
  let failures = 0

  for (const file of files) {
    const committed = readFileSync(join(surfaiceDir, file), 'utf-8')
    const expected = parse(committed)
    const route = expected.route

    let response: Response
    try {
      response = await fetch(new URL(route, baseUrl).toString(), {
        headers: { 'Accept': 'text/surfaice' },
      })
    } catch (err) {
      console.error(`::error::Failed to fetch ${route}: ${String(err)}`)
      failures++
      continue
    }

    if (!response.ok) {
      console.error(`::error::${route} returned ${response.status} ${response.statusText}`)
      failures++
      continue
    }

    const live = parse(await response.text())
    const result = diff(expected, live)
    diffs.push({ ...result, file })

    if (result.status === 'match') {
      console.log(`✅ ${route} — no drift`)
    } else {
      console.log(`❌ ${route} — DRIFT: ${result.summary}`)
      for (const a of result.added)   console.log(`   + [${a.id}] ${a.type} "${a.label}"`)
      for (const r of result.removed) console.log(`   - [${r.id}] ${r.type} "${r.label}"`)
      for (const c of result.changed) console.log(`   ~ [${c.id}].${c.field}: "${c.expected}" → "${c.actual}"`)
      failures++
    }
  }

  const driftDetected = diffs.some(d => d.status === 'drift') || failures > 0
  const summaries = diffs.filter(d => d.status === 'drift').map(d => `${d.route}: ${d.summary}`)
  const driftSummary = summaries.length > 0 ? summaries.join('; ') : 'No drift detected'

  setOutput('drift-detected', String(driftDetected))
  setOutput('drift-summary', driftSummary)
  setOutput('diff-json', JSON.stringify(diffs))

  if (driftDetected && failOnDrift) {
    console.error(`\n::error::UI drift detected! ${driftSummary}`)
    process.exit(1)
  }
}

run().catch((err: unknown) => {
  console.error(`::error::${String(err)}`)
  process.exit(1)
})
