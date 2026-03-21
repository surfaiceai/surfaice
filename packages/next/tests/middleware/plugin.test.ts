import { describe, it, expect } from 'vitest'
import { withSurfaice } from '../../src/plugin.js'

describe('withSurfaice plugin', () => {
  it('merges with existing nextConfig', () => {
    const result = withSurfaice({ enabled: true })({ reactStrictMode: true })
    expect(result.reactStrictMode).toBe(true)
    expect(result.env).toBeDefined()
  })

  it('sets SURFAICE_ENABLED env var when enabled', () => {
    const result = withSurfaice({ enabled: true })({})
    expect(result.env?.__SURFAICE_ENABLED).toBe('true')
  })

  it('sets SURFAICE_ENABLED to false when disabled', () => {
    const result = withSurfaice({ enabled: false })({})
    expect(result.env?.__SURFAICE_ENABLED).toBe('false')
  })

  it('uses empty config when no options provided', () => {
    const result = withSurfaice()({})
    expect(result.env).toBeDefined()
  })
})
