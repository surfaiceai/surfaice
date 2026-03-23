import { describe, it, expect } from 'vitest'
import { routeToFilename } from '../../src/generator/manifest-generator.js'

describe('routeToFilename', () => {
  it('root / → index.surfaice.md', () => {
    expect(routeToFilename('/')).toBe('index.surfaice.md')
  })

  it('/login → login.surfaice.md', () => {
    expect(routeToFilename('/login')).toBe('login.surfaice.md')
  })

  it('/dashboard/settings → dashboard-settings.surfaice.md', () => {
    expect(routeToFilename('/dashboard/settings')).toBe('dashboard-settings.surfaice.md')
  })

  it('/novels/:id → novels-_id.surfaice.md', () => {
    expect(routeToFilename('/novels/:id')).toBe('novels-_id.surfaice.md')
  })

  it('/novels/:id/read/:chapterId → novels-_id-read-_chapterId.surfaice.md', () => {
    expect(routeToFilename('/novels/:id/read/:chapterId')).toBe('novels-_id-read-_chapterId.surfaice.md')
  })

  it('/admin/dashboard → admin-dashboard.surfaice.md', () => {
    expect(routeToFilename('/admin/dashboard')).toBe('admin-dashboard.surfaice.md')
  })
})
