import { resolve } from 'path'
import { analyze } from '@surfaice/analyze'

export interface AnalyzeCommandOptions {
  appDir: string
  out: string
  stripLocale: boolean
  exclude: string[]
  routes?: string[]
  dryRun: boolean
}

export async function analyzeCommand(options: AnalyzeCommandOptions): Promise<void> {
  const { appDir, out, stripLocale, exclude, routes, dryRun } = options

  console.log(`\n🔍 Analyzing ${appDir}...\n`)

  const result = await analyze({
    appDir: resolve(appDir),
    outDir: dryRun ? undefined : resolve(out),
    stripLocale,
    exclude,
    routes,
    dryRun,
  })

  if (dryRun) {
    for (const page of result.pages) {
      console.log(`\n${'─'.repeat(60)}`)
      console.log(`📄 ${page.route}`)
      console.log('─'.repeat(60))
      console.log(page.markdown)
    }
  }

  console.log(`\n📄 Analyzed ${result.totalRoutes} routes, ${result.totalElements} elements\n`)

  for (const page of result.pages) {
    const label = page.elementCount === 0 ? ' ⚠️  (no elements)' : ''
    console.log(`  ${page.route.padEnd(40)} — ${page.elementCount} elements${label}`)
  }

  if (!dryRun && options.out) {
    console.log(`\n✅ Written to ${resolve(options.out)}/`)
  }

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}:`)
    for (const w of result.warnings) {
      console.log(`  - ${w}`)
    }
  }
}
