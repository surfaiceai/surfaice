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
export { resolveElementLabel } from './parser/label-resolver.js'
export type { LabelSource, LabelSourceKind } from './parser/label-resolver.js'
export { parseSurfaiceTags } from './jsdoc/surfaice-tags.js'
