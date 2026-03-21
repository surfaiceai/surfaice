import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import React from 'react'
import { SurfaiceProvider, ui, useSurfaicePage } from '../../src/index'
import type { SurfaicePage } from '@surfaice/format'

// Capture hook result after all effects settle
function PageCapture({ onPage }: { onPage: (p: SurfaicePage | null) => void }) {
  const page = useSurfaicePage()
  React.useEffect(() => { onPage(page) })
  return null
}

describe('integration — annotated React page → SurfaicePage AST', () => {
  it('collects page metadata from ui.page', async () => {
    let captured: SurfaicePage | null = null
    await act(async () => {
      render(
        <SurfaiceProvider enabled>
          <ui.page route="/settings" name="Settings Page" states={['auth-required']}>
            <PageCapture onPage={p => { captured = p }} />
          </ui.page>
        </SurfaiceProvider>
      )
    })
    expect(captured?.route).toBe('/settings')
    expect(captured?.name).toBe('Settings Page')
    expect(captured?.states).toEqual(['auth-required'])
    expect(captured?.version).toBe('v1')
  })

  it('collects sections from ui.section', async () => {
    let captured: SurfaicePage | null = null
    await act(async () => {
      render(
        <SurfaiceProvider enabled>
          <ui.page route="/settings">
            <ui.section name="Profile">
              <PageCapture onPage={p => { captured = p }} />
            </ui.section>
          </ui.page>
        </SurfaiceProvider>
      )
    })
    expect(captured?.sections).toHaveLength(1)
    expect(captured?.sections[0].name).toBe('Profile')
  })

  it('collects elements from ui.element', async () => {
    let captured: SurfaicePage | null = null
    await act(async () => {
      render(
        <SurfaiceProvider enabled>
          <ui.page route="/settings">
            <ui.section name="Profile">
              <ui.element id="name" type="textbox" label="Display Name" current="{user.name}" action="PUT /api/profile">
                <input defaultValue="test" />
              </ui.element>
              <ui.element id="save" type="button" label="Save Changes" attributes={['destructive']} action="PUT /api/profile" result="toast 'Saved!'">
                <button>Save</button>
              </ui.element>
            </ui.section>
            <PageCapture onPage={p => { captured = p }} />
          </ui.page>
        </SurfaiceProvider>
      )
    })
    const elements = captured?.sections[0].elements
    expect(elements).toHaveLength(2)
    expect(elements?.[0].id).toBe('name')
    expect(elements?.[0].current).toBe('{user.name}')
    expect(elements?.[1].id).toBe('save')
    expect(elements?.[1].attributes).toEqual(['destructive'])
  })

  it('injects live runtime value over current template', async () => {
    let captured: SurfaicePage | null = null
    await act(async () => {
      render(
        <SurfaiceProvider enabled>
          <ui.page route="/settings">
            <ui.section name="Profile">
              <ui.element id="name" type="textbox" label="Display Name"
                value="Haosu Wu"
                current="{user.name}">
                <input defaultValue="Haosu Wu" />
              </ui.element>
            </ui.section>
            <PageCapture onPage={p => { captured = p }} />
          </ui.page>
        </SurfaiceProvider>
      )
    })
    const el = captured?.sections[0].elements[0]
    // Runtime value takes precedence for agent-facing snapshot
    expect(el?.value).toBe('Haosu Wu')
  })

  it('children always render regardless of enabled state', () => {
    const { getByTestId } = render(
      <SurfaiceProvider>
        <ui.page route="/settings">
          <ui.section name="Profile">
            <ui.element id="btn" type="button" label="Click Me">
              <button data-testid="the-button">Click Me</button>
            </ui.element>
          </ui.section>
        </ui.page>
      </SurfaiceProvider>
    )
    expect(getByTestId('the-button')).toBeTruthy()
  })

  it('no annotations collected when disabled', async () => {
    let captured: SurfaicePage | null = null
    await act(async () => {
      render(
        <SurfaiceProvider>
          <ui.page route="/settings">
            <ui.section name="Profile">
              <ui.element id="name" type="textbox" label="Name">
                <input />
              </ui.element>
            </ui.section>
            <PageCapture onPage={p => { captured = p }} />
          </ui.page>
        </SurfaiceProvider>
      )
    })
    // disabled provider → hook returns null
    expect(captured).toBeNull()
  })
})
