import React, { useRef, useState, useCallback } from 'react'
import { SurfaiceContext } from './context'
import { SurfaiceRegistry } from './registry'
import type { SurfaicePage, Section, Element } from '@surfaice/format'

export interface SurfaiceProviderProps {
  /** Enable Surfaice annotation collection. Default: false (zero overhead in production) */
  enabled?: boolean
  children: React.ReactNode
}

/**
 * SurfaiceProvider — wrap your app (or a page) with this to enable annotation collection.
 * When disabled (default), all annotation components are pure passthroughs with zero overhead.
 */
export function SurfaiceProvider({ enabled = false, children }: SurfaiceProviderProps) {
  const registryRef = useRef<SurfaiceRegistry>(new SurfaiceRegistry())
  const [page, setPage] = useState<SurfaicePage | null>(null)

  const syncPage = useCallback(() => {
    setPage(registryRef.current.toSurfaicePage())
  }, [])

  const registerPage = useCallback((p: Partial<SurfaicePage>) => {
    registryRef.current.setPage(p)
    syncPage()
  }, [syncPage])

  const registerSection = useCallback((s: Partial<Section>) => {
    registryRef.current.addSection(s)
    syncPage()
  }, [syncPage])

  const registerElement = useCallback((e: Partial<Element>) => {
    registryRef.current.addElement(e)
    syncPage()
  }, [syncPage])

  return (
    <SurfaiceContext.Provider value={{ enabled, page: enabled ? page : null, registerPage, registerSection, registerElement }}>
      {children}
    </SurfaiceContext.Provider>
  )
}
