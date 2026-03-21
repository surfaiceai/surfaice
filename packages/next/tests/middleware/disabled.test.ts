import { describe, it, expect } from 'vitest'
import { shouldHandleSurfaice, isRouteAllowed } from '../../src/middleware.js'

describe('disabled config', () => {
  it('route is not allowed when enabled=false', () => {
    expect(isRouteAllowed('/settings', { enabled: false })).toBe(false)
  })

  it('route is allowed when enabled=true (default)', () => {
    expect(isRouteAllowed('/settings', { enabled: true })).toBe(true)
  })
})
