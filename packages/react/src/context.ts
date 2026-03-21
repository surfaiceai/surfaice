import { createContext } from 'react'
import type { SurfaicePage, Section, Element } from '@surfaice/format'

export interface SurfaiceContextValue {
  enabled: boolean
  page: SurfaicePage | null
  registerPage: (page: Partial<SurfaicePage>) => void
  registerSection: (section: Partial<Section>) => void
  registerElement: (element: Partial<Element>) => void
}

export const SurfaiceContext = createContext<SurfaiceContextValue>({
  enabled: false,
  page: null,
  registerPage: () => {},
  registerSection: () => {},
  registerElement: () => {},
})
