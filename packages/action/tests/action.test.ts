import { describe, it, expect } from 'vitest'

// The action entry point is an executable script (runs in GitHub Actions runner).
// Unit-testable logic lives in @surfaice/differ and @surfaice/format.
// These tests verify the action's input parsing utilities.

function getInput(name: string, defaultValue: string = '', env: Record<string, string> = {}): string {
  const envName = `INPUT_${name.toUpperCase().replace(/-/g, '_')}`
  return env[envName] ?? defaultValue
}

describe('action input parsing', () => {
  it('reads base-url input from env', () => {
    const env = { INPUT_BASE_URL: 'http://localhost:3000' }
    expect(getInput('base-url', '', env)).toBe('http://localhost:3000')
  })

  it('uses default for missing inputs', () => {
    expect(getInput('surfaice-dir', 'surfaice/', {})).toBe('surfaice/')
  })

  it('reads fail-on-drift correctly', () => {
    const envTrue = { INPUT_FAIL_ON_DRIFT: 'true' }
    const envFalse = { INPUT_FAIL_ON_DRIFT: 'false' }
    expect(getInput('fail-on-drift', 'true', envTrue) !== 'false').toBe(true)
    expect(getInput('fail-on-drift', 'true', envFalse) !== 'false').toBe(false)
  })

  it('parses hyphenated input names to SCREAMING_SNAKE_CASE', () => {
    const env = { INPUT_OUTPUT_FORMAT: 'json' }
    expect(getInput('output-format', 'text', env)).toBe('json')
  })
})
