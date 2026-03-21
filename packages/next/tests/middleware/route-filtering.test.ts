import { describe, it, expect } from 'vitest'
import { isRouteAllowed } from '../../src/middleware.js'

describe('isRouteAllowed — route filtering', () => {
  it('allows all routes when no include/exclude configured', () => {
    expect(isRouteAllowed('/settings', {})).toBe(true)
    expect(isRouteAllowed('/dashboard', {})).toBe(true)
    expect(isRouteAllowed('/api/data', {})).toBe(true)
  })

  it('allows only included routes', () => {
    const config = { include: ['/settings', '/dashboard'] }
    expect(isRouteAllowed('/settings', config)).toBe(true)
    expect(isRouteAllowed('/dashboard', config)).toBe(true)
    expect(isRouteAllowed('/profile', config)).toBe(false)
  })

  it('excludes specified routes', () => {
    const config = { exclude: ['/api', '/_next'] }
    expect(isRouteAllowed('/settings', config)).toBe(true)
    expect(isRouteAllowed('/api/data', config)).toBe(false)
    expect(isRouteAllowed('/_next/static', config)).toBe(false)
  })

  it('exclude takes priority when both configured', () => {
    const config = { include: ['/settings'], exclude: ['/settings/private'] }
    expect(isRouteAllowed('/settings', config)).toBe(true)
    expect(isRouteAllowed('/settings/private', config)).toBe(false)
  })

  it('include uses prefix matching', () => {
    const config = { include: ['/settings'] }
    expect(isRouteAllowed('/settings/profile', config)).toBe(true)
    expect(isRouteAllowed('/other', config)).toBe(false)
  })
})
