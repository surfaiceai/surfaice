import { describe, it, expect } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import React, { useState } from 'react'
import { SurfaiceProvider, ui, useSurfaicePage } from '../../src/index'
import type { SurfaicePage } from '@surfaice/format'

// Component that reads page after effects via a state flush
function PageSnapAfterEffect({ onSnap }: { onSnap: (p: SurfaicePage | null) => void }) {
  const page = useSurfaicePage()
  // Call onSnap every render — last value after effects is what we care about
  React.useEffect(() => {
    onSnap(page)
  })
  return null
}

describe('SurfaiceProvider — context nesting', () => {
  it('registers a page when ui.page is rendered inside an enabled provider', async () => {
    let captured: SurfaicePage | null = null

    await act(async () => {
      render(
        <SurfaiceProvider enabled>
          <ui.page route="/settings">
            <PageSnapAfterEffect onSnap={p => { captured = p }} />
          </ui.page>
        </SurfaiceProvider>
      )
    })

    expect(captured).not.toBeNull()
    expect(captured?.route).toBe('/settings')
    expect(captured?.version).toBe('v1')
  })

  it('noop when provider is disabled — children still render', () => {
    let rendered = false

    render(
      <SurfaiceProvider>
        <ui.page route="/settings">
          <span ref={() => { rendered = true }} />
        </ui.page>
      </SurfaiceProvider>
    )

    expect(rendered).toBe(true)
  })
})
