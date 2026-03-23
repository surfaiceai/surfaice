import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { Project } from 'ts-morph'
import { serialize } from '@surfaice/format'
import { discoverRoutes } from './discovery/nextjs-routes.js'
import { parseTsxFile } from './parser/tsx-parser.js'
import { parseSurfaiceTags } from './jsdoc/surfaice-tags.js'
import { mapActionsToElements } from './jsdoc/action-mapper.js'
import { generateManifest, routeToFilename } from './generator/manifest-generator.js'
import type { AnalyzeOptions, AnalyzeResult, PageResult } from './types.js'

/**
 * Walk up from dir to find tsconfig.json. Returns path if found, undefined otherwise.
 */
function findTsConfig(startDir: string): string | undefined {
  let current = resolve(startDir)
  for (let i = 0; i < 6; i++) {
    const candidate = join(current, 'tsconfig.json')
    if (existsSync(candidate)) return candidate
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return undefined
}

/**
 * Full analysis pipeline: appDir → .surfaice.md files.
 *
 * Stages per route:
 * 1. Parse TSX (ts-morph)
 * 2. Parse @surfaice JSDoc tags
 * 3. Map actions to elements
 * 4. Generate SurfaicePage manifest
 * 5. Serialize to .surfaice.md
 * 6. Write to outDir (unless dryRun)
 */
export async function analyze(options: AnalyzeOptions): Promise<AnalyzeResult> {
  const {
    appDir,
    outDir,
    stripLocale = true,
    exclude = ['api'],
    routes: routeFilter,
    dryRun = false,
  } = options

  // 1. Discover all routes
  let discoveredRoutes = discoverRoutes({ appDir, stripLocale, exclude })

  // Apply route filter if provided
  if (routeFilter && routeFilter.length > 0) {
    discoveredRoutes = discoveredRoutes.filter(r => routeFilter.includes(r.route))
  }

  // 2. Init ts-morph project — find tsconfig or use bare defaults
  const tsConfigPath = findTsConfig(appDir)
  const project = new Project({
    ...(tsConfigPath
      ? { tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true }
      : {
          compilerOptions: {
            jsx: 4, // JsxEmit.ReactJSX
            allowJs: true,
            skipLibCheck: true,
          },
        }),
  })

  const pageResults: PageResult[] = []
  const globalWarnings: string[] = []

  // 3. Process each route through the pipeline
  for (const route of discoveredRoutes) {
    try {
      // Parse TSX
      const parsedPage = parseTsxFile(route.filePath, route.route, project)

      // Parse JSDoc tags
      const sourceFile = project.getSourceFile(route.filePath)
        ?? project.addSourceFileAtPath(route.filePath)
      const tags = parseSurfaiceTags(sourceFile)

      // Map actions to elements
      const mappedActions = mapActionsToElements(tags, parsedPage.elements, sourceFile)

      // Generate manifest
      const manifest = generateManifest({ route, page: parsedPage, tags, mappedActions })

      // Serialize
      const markdown = serialize(manifest)

      // Collect warnings
      const warnings: string[] = []
      for (const el of parsedPage.elements) {
        if (!el.label) {
          warnings.push(`${route.route} line ${el.sourceLocation.line}: No label found for ${el.jsxTag}[${el.id}]`)
        }
      }
      if (parsedPage.elements.length === 0) {
        warnings.push(`${route.route}: 0 interactive elements detected`)
      }

      pageResults.push({
        route: route.route,
        filePath: route.filePath,
        manifest,
        markdown,
        elementCount: parsedPage.elements.length,
        warnings,
      })
    } catch (err) {
      // Per-page errors don't crash the full run
      const msg = `${route.route}: Error during analysis — ${String(err)}`
      globalWarnings.push(msg)
      console.error(`⚠️  ${msg}`)
    }
  }

  // 4. Write files to outDir
  if (!dryRun && outDir) {
    mkdirSync(outDir, { recursive: true })
    for (const result of pageResults) {
      const filename = routeToFilename(result.route)
      writeFileSync(join(outDir, filename), result.markdown, 'utf-8')
    }
  }

  return {
    pages: pageResults,
    totalRoutes: pageResults.length,
    totalElements: pageResults.reduce((n, p) => n + p.elementCount, 0),
    warnings: [...globalWarnings, ...pageResults.flatMap(p => p.warnings)],
  }
}
