import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import React from 'react'
import { serialize } from '@surfaice/format'
import { SurfaiceProvider, ui, useSurfaicePage } from '../../src/index'
import type { SurfaicePage } from '@surfaice/format'

function PageCapture({ onPage }: { onPage: (p: SurfaicePage | null) => void }) {
  const page = useSurfaicePage()
  React.useEffect(() => { onPage(page) })
  return null
}

describe('integration — annotated React page → .surfaice.md string', () => {
  it('full annotation pipeline produces valid .surfaice.md', async () => {
    let captured: SurfaicePage | null = null
    await act(async () => {
      render(
        <SurfaiceProvider enabled>
          <ui.page route="/settings" name="Settings Page">
            <ui.section name="Profile">
              <ui.element id="name" type="textbox" label="Display Name"
                value="Haosu Wu" current="{user.name}" accepts="string">
                <input defaultValue="Haosu Wu" />
              </ui.element>
              <ui.element id="save" type="button" label="Save Changes"
                attributes={['destructive']} action="PUT /api/profile" result="toast 'Saved!'">
                <button>Save</button>
              </ui.element>
            </ui.section>
            <PageCapture onPage={p => { captured = p }} />
          </ui.page>
        </SurfaiceProvider>
      )
    })

    expect(captured).not.toBeNull()
    const md = serialize(captured!)

    // Verify the markdown contains expected structure
    expect(md).toContain('surfaice: v1')
    expect(md).toContain('route: /settings')
    expect(md).toContain('name: Settings Page')
    expect(md).toContain('## Profile')
    expect(md).toContain('[name] textbox "Display Name"')
    expect(md).toContain('accepts: string')
    expect(md).toContain('[save] button "Save Changes"')
    expect(md).toContain('(destructive)')
    expect(md).toContain('PUT /api/profile')
  })

  it('multiple sections serialize correctly', async () => {
    let captured: SurfaicePage | null = null
    await act(async () => {
      render(
        <SurfaiceProvider enabled>
          <ui.page route="/dashboard">
            <ui.section name="Overview">
              <ui.element id="title" type="heading" label="Dashboard">
                <h1>Dashboard</h1>
              </ui.element>
            </ui.section>
            <ui.section name="Actions">
              <ui.element id="create" type="button" label="Create New" action="POST /api/items">
                <button>Create New</button>
              </ui.element>
            </ui.section>
            <PageCapture onPage={p => { captured = p }} />
          </ui.page>
        </SurfaiceProvider>
      )
    })

    const md = serialize(captured!)
    expect(md).toContain('## Overview')
    expect(md).toContain('## Actions')
    expect(md).toContain('[title] heading "Dashboard"')
    expect(md).toContain('[create] button "Create New"')
  })
})
