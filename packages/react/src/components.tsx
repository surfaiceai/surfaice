import React, { useContext, useEffect, createContext } from 'react'
import { SurfaiceContext } from './context.js'
import type { Element, ElementType, Capability } from '@surfaice/format'

// Inner context to pass section name down to ui.element
const SectionNameContext = createContext<string | null>(null)

// ── ui.page ──────────────────────────────────────────────────────────────────

export interface UIPageProps {
  route: string
  name?: string
  states?: string[]
  capabilities?: Capability[]
  children: React.ReactNode
}

function UIPage({ route, name, states, capabilities, children }: UIPageProps) {
  const ctx = useContext(SurfaiceContext)

  useEffect(() => {
    if (ctx.enabled) {
      ctx.registerPage({ version: 'v1', route, name, states, capabilities })
    }
  }, [ctx.enabled, route, name])

  return <>{children}</>
}

// ── ui.section ────────────────────────────────────────────────────────────────

export interface UISectionProps {
  name: string
  children: React.ReactNode
}

function UISection({ name, children }: UISectionProps) {
  const ctx = useContext(SurfaiceContext)

  useEffect(() => {
    if (ctx.enabled) {
      ctx.registerSection({ name })
    }
  }, [ctx.enabled, name])

  return (
    <SectionNameContext.Provider value={name}>
      {children}
    </SectionNameContext.Provider>
  )
}

// ── ui.element ────────────────────────────────────────────────────────────────

export interface UIElementProps {
  id: string
  type: ElementType
  label: string
  attributes?: string[]
  action?: string
  result?: string
  navigates?: string
  /** Live runtime value — injected into agent-facing markdown */
  value?: string | number | boolean
  /** Template binding for static export, e.g. "{user.name}" */
  current?: string
  accepts?: string
  options?: string[]
  /** Value displayed by display elements at runtime */
  shows?: string | number
  children: React.ReactNode
}

function UIElement({ children, value, shows, ...props }: UIElementProps) {
  const ctx = useContext(SurfaiceContext)
  const sectionName = useContext(SectionNameContext)

  useEffect(() => {
    if (ctx.enabled) {
      ctx.registerElement(
        {
          ...props,
          value: value !== undefined ? String(value) : props.current,
          shows: shows !== undefined ? String(shows) : undefined,
        },
        sectionName ?? undefined,
      )
    }
  }, [ctx.enabled, value, shows, props.id, sectionName])

  return <>{children}</>
}

// ── ui namespace export ───────────────────────────────────────────────────────

export const ui = {
  page: UIPage,
  section: UISection,
  element: UIElement,
}
