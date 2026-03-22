'use client'

import { useContext } from 'react'
import { SurfaiceContext } from './context.js'
import type { SurfaicePage } from '@surfaice/format'

/**
 * Hook to access the current collected SurfaicePage AST.
 * Reactive — re-renders when annotations change.
 * Returns null when provider is disabled or no page has been registered.
 */
export function useSurfaicePage(): SurfaicePage | null {
  const ctx = useContext(SurfaiceContext)
  return ctx.page
}
