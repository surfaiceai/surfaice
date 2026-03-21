import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportCommand } from '../../src/commands/export.js'
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const SAMPLE_MD = `---
surfaice: v1
route: /settings
---

# /settings

## Profile
- [name] textbox "Display Name"
`

describe('exportCommand', () => {
  let outDir: string

  beforeEach(() => {
    outDir = join(tmpdir(), `surfaice-test-${Date.now()}`)
    mockFetch.mockReset()
  })

  afterEach(() => {
    if (existsSync(outDir)) rmSync(outDir, { recursive: true })
  })

  it('creates output directory if it does not exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => SAMPLE_MD,
    })

    await exportCommand({ baseUrl: 'http://localhost:3000', routes: ['/settings'], outDir })
    expect(existsSync(outDir)).toBe(true)
  })

  it('fetches route with Accept: text/surfaice header', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => SAMPLE_MD })

    await exportCommand({ baseUrl: 'http://localhost:3000', routes: ['/settings'], outDir })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/settings',
      expect.objectContaining({ headers: { 'Accept': 'text/surfaice' } })
    )
  })

  it('writes markdown to correctly named file', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => SAMPLE_MD })

    await exportCommand({ baseUrl: 'http://localhost:3000', routes: ['/settings'], outDir })

    const filepath = join(outDir, 'settings.surfaice.md')
    expect(existsSync(filepath)).toBe(true)
    expect(readFileSync(filepath, 'utf-8')).toBe(SAMPLE_MD)
  })

  it('names root route as index.surfaice.md', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => SAMPLE_MD })

    await exportCommand({ baseUrl: 'http://localhost:3000', routes: ['/'], outDir })

    expect(existsSync(join(outDir, 'index.surfaice.md'))).toBe(true)
  })

  it('converts nested routes to flat filenames', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => SAMPLE_MD })

    await exportCommand({ baseUrl: 'http://localhost:3000', routes: ['/settings/profile'], outDir })

    expect(existsSync(join(outDir, 'settings-profile.surfaice.md'))).toBe(true)
  })

  it('handles failed fetch gracefully (does not throw)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })

    // Should not throw
    await expect(
      exportCommand({ baseUrl: 'http://localhost:3000', routes: ['/missing'], outDir })
    ).resolves.not.toThrow()
  })

  it('exports multiple routes', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, text: async () => SAMPLE_MD })
      .mockResolvedValueOnce({ ok: true, text: async () => SAMPLE_MD })

    await exportCommand({
      baseUrl: 'http://localhost:3000',
      routes: ['/settings', '/dashboard'],
      outDir,
    })

    expect(existsSync(join(outDir, 'settings.surfaice.md'))).toBe(true)
    expect(existsSync(join(outDir, 'dashboard.surfaice.md'))).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
