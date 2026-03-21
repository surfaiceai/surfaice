import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

export interface ExportOptions {
  baseUrl: string
  routes: string[]
  /** Output directory. Default: 'surfaice/' */
  outDir: string
}

/**
 * Fetch each route with Accept: text/surfaice and write .surfaice.md files.
 */
export async function exportCommand(options: ExportOptions): Promise<void> {
  mkdirSync(options.outDir, { recursive: true })

  for (const route of options.routes) {
    const url = new URL(route, options.baseUrl).toString()

    let response: Response
    try {
      response = await fetch(url, {
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

    const markdown = await response.text()
    const filename = routeToFilename(route)
    const filepath = join(options.outDir, filename)

    mkdirSync(dirname(filepath), { recursive: true })
    writeFileSync(filepath, markdown)
    console.log(`✅ ${route} → ${filepath}`)
  }
}

export function routeToFilename(route: string): string {
  if (route === '/') return 'index.surfaice.md'
  return `${route.slice(1).replace(/\//g, '-')}.surfaice.md`
}
