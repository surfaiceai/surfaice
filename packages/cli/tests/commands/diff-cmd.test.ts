import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { diffCommand, DiffOptions } from '../../src/commands/diff.js'
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
- [name] textbox "Display Name"
- [save] button "Save Changes" → PUT /api/profile
`

const PAGE_ADDED = `---
surfaice: v1
route: /settings
---

# /settings

## Profile
- [name] textbox "Display Name"
- [save] button "Save Changes" → PUT /api/profile
- [cancel] button "Cancel" → navigates: /dashboard
`

describe('diffCommand', () => {
  let dir: string
  let results: Array<{ route: string; status: string; summary: string }>

  beforeEach(() => {
    dir = join(tmpdir(), `surfaice-diff-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
    results = []
    mockFetch.mockReset()
  })

  afterEach(() => {
    if (existsSync(dir)) rmSync(dir, { recursive: true })
  })

  it('returns match result for identical pages', async () => {
    writeFileSync(join(dir, 'settings.surfaice.md'), PAGE_V1)
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => PAGE_V1 })

    const output = await diffCommand({ dir, baseUrl: 'http://localhost:3000' })
    expect(output[0].status).toBe('match')
    expect(output[0].route).toBe('/settings')
  })

  it('returns drift result with added elements', async () => {
    writeFileSync(join(dir, 'settings.surfaice.md'), PAGE_V1)
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => PAGE_ADDED })

    const output = await diffCommand({ dir, baseUrl: 'http://localhost:3000' })
    expect(output[0].status).toBe('drift')
    expect(output[0].added).toHaveLength(1)
    expect(output[0].added[0].id).toBe('cancel')
  })

  it('returns results for all files', async () => {
    writeFileSync(join(dir, 'settings.surfaice.md'), PAGE_V1)
    writeFileSync(join(dir, 'dashboard.surfaice.md'), PAGE_V1)
    mockFetch
      .mockResolvedValueOnce({ ok: true, text: async () => PAGE_V1 })
      .mockResolvedValueOnce({ ok: true, text: async () => PAGE_V1 })

    const output = await diffCommand({ dir, baseUrl: 'http://localhost:3000' })
    expect(output).toHaveLength(2)
  })
})
