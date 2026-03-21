import type { SurfaicePage, Section, Element, Capability } from '@surfaice/format'

/**
 * SurfaiceRegistry collects UI annotations at render time.
 * Components call register* methods during their useEffect hooks.
 * The middleware/dev-tools call toSurfaicePage() to extract the snapshot.
 */
export class SurfaiceRegistry {
  private _page: Partial<SurfaicePage> | null = null
  private _sections: Section[] = []
  private _currentSectionIndex: number = -1

  setPage(page: Partial<SurfaicePage>): void {
    this._page = { ...page }
    this._sections = []
    this._currentSectionIndex = -1
  }

  addSection(section: Partial<Section>): void {
    const newSection: Section = {
      name: section.name ?? 'Unnamed Section',
      elements: [],
    }
    this._sections.push(newSection)
    this._currentSectionIndex = this._sections.length - 1
  }

  addElement(element: Partial<Element>): void {
    if (this._currentSectionIndex < 0) return
    const el: Element = {
      id: element.id ?? '',
      type: element.type ?? 'text',
      label: element.label ?? '',
      ...element,
    }
    this._sections[this._currentSectionIndex].elements.push(el)
  }

  toSurfaicePage(): SurfaicePage | null {
    if (!this._page) return null
    return {
      version: this._page.version ?? 'v1',
      route: this._page.route ?? '/',
      ...(this._page.name !== undefined && { name: this._page.name }),
      ...(this._page.states !== undefined && { states: this._page.states }),
      ...(this._page.capabilities !== undefined && { capabilities: this._page.capabilities }),
      sections: [...this._sections],
    }
  }

  get page(): SurfaicePage | null {
    return this.toSurfaicePage()
  }

  reset(): void {
    this._page = null
    this._sections = []
    this._currentSectionIndex = -1
  }
}
