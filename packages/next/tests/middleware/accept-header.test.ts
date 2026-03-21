import { describe, it, expect } from 'vitest'
import { shouldHandleSurfaice } from '../../src/middleware.js'

// Test the core routing logic without Next.js runtime dependency
describe('shouldHandleSurfaice — Accept header routing', () => {
  it('returns true for Accept: text/surfaice', () => {
    expect(shouldHandleSurfaice('text/surfaice')).toBe(true)
  })

  it('returns true for Accept header containing text/surfaice', () => {
    expect(shouldHandleSurfaice('text/html, text/surfaice, */*')).toBe(true)
  })

  it('returns false for Accept: text/html', () => {
    expect(shouldHandleSurfaice('text/html')).toBe(false)
  })

  it('returns false for empty Accept header', () => {
    expect(shouldHandleSurfaice('')).toBe(false)
  })

  it('returns false for undefined Accept header', () => {
    expect(shouldHandleSurfaice(undefined)).toBe(false)
  })
})
