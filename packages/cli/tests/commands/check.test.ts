import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkCommand } from '../../src/commands/check.js'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const PAGE_V1 = `---
surfaice: v1
route: /settings
---

# /settings

## Profile
- [name] textbox "Display Name" → current: {user.name}
- [save] button "Save Changes" → PUT /api/profile
`

const PAGE_DRIFTED = `---
surfaice: v1
route: /settings
---

# /settings

## Profile
- [name] textbox "Display Name" → current: {user.name}
- [save] button "Save All Changes" → PUT /api/profile
`

describe('checkCommand', () => {
  let dir: string

  beforeEach(() => {
    dir = join(tmpdir(), `surfaice-check-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
    mockFetch.mockReset()
  })

  afterEach(() => {
    if (existsSync(dir)) rmSync(dir, { recursive: true })
  })

  it('returns exit code 0 when no drift', async () => {
    writeFileSync(join(dir, 'settings.surfaice.md'), PAGE_V1)
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => PAGE_V1 })

    const exitCode = await checkCommand({ dir, baseUrl: 'http://localhost:3000' })
    expect(exitCode).toBe(0)
  })

  it('returns exit code 1 when drift detected', async () => {
    writeFileSync(join(dir, 'settings.surfaice.md'), PAGE_V1)
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => PAGE_DRIFTED })

    const exitCode = await checkCommand({ dir, baseUrl: 'http://localhost:3000' })
    expect(exitCode).toBe(1)
  })

  it('returns exit code 1 when route returns 404', async () => {
    writeFileSync(join(dir, 'settings.surfaice.md'), PAGE_V1)
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })

    const exitCode = await checkCommand({ dir, baseUrl: 'http://localhost:3000' })
    expect(exitCode).toBe(1)
  })

  it('checks all .surfaice.md files in directory', async () => {
    writeFileSync(join(dir, 'settings.surfaice.md'), PAGE_V1)
    writeFileSync(join(dir, 'dashboard.surfaice.md'), PAGE_V1)
    mockFetch
      .mockResolvedValueOnce({ ok: true, text: async () => PAGE_V1 })
      .mockResolvedValueOnce({ ok: true, text: async () => PAGE_V1 })

    const exitCode = await checkCommand({ dir, baseUrl: 'http://localhost:3000' })
    expect(exitCode).toBe(0)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('ignores non-.surfaice.md files', async () => {
    writeFileSync(join(dir, 'README.md'), '# not a surfaice file')
    writeFileSync(join(dir, 'settings.surfaice.md'), PAGE_V1)
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => PAGE_V1 })

    const exitCode = await checkCommand({ dir, baseUrl: 'http://localhost:3000' })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(exitCode).toBe(0)
  })
})
