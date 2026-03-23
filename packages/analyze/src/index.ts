export type {
  DiscoveredRoute,
  DiscoveryOptions,
  ElementType,
  ExtractedElement,
  ParsedPage,
  SurfaiceTag,
  MappedAction,
  AnalyzeOptions,
  PageResult,
  AnalyzeResult,
} from './types.js'

export { discoverRoutes } from './discovery/nextjs-routes.js'
export { parseTsxFile } from './parser/tsx-parser.js'
export { extractElements } from './parser/jsx-elements.js'
