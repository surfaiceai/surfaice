import type { SurfaicePage, Section, Element } from '@surfaice/format'

interface PendingElement {
  sectionName: string
  element: Element
}

/**
 * SurfaiceRegistry collects UI annotations at render time.
 *
 * React fires useEffect bottom-up (children before parents), so registration
 * order is: elements → sections → page. We buffer elements with their target
 * section name and reconcile when producing the final AST.
 */
export class SurfaiceRegistry {
  private _meta: Partial<SurfaicePage> | null = null
  private _sectionNames: string[] = []
  private _pendingElements: PendingElement[] = []
  // Track which section name the most recently registered section belongs to,
  // so elements registered before their section still land correctly.
  private _currentSectionName: string | null = null

  setPage(page: Partial<SurfaicePage>): void {
    this._meta = { ...page }
  }

  addSection(section: Partial<Section>): void {
    const name = section.name ?? 'Unnamed Section'
    if (!this._sectionNames.includes(name)) {
      this._sectionNames.push(name)
    }
    this._currentSectionName = name
  }

  /** Register an element, tagged to the current section name */
  addElement(element: Partial<Element>, sectionName?: string): void {
    const target = sectionName ?? this._currentSectionName
    if (!target) return

    const el: Element = {
      id: element.id ?? '',
      type: element.type ?? 'text',
      label: element.label ?? '',
      ...element,
    }
    this._pendingElements.push({ sectionName: target, element: el })
  }

  toSurfaicePage(): SurfaicePage | null {
    if (!this._meta) return null

    // Build sections, attaching elements
    const sections: Section[] = this._sectionNames.map(name => ({
      name,
      elements: this._pendingElements
        .filter(p => p.sectionName === name)
        .map(p => p.element),
    }))

    return {
      version: this._meta.version ?? 'v1',
      route: this._meta.route ?? '/',
      ...(this._meta.name !== undefined && { name: this._meta.name }),
      ...(this._meta.states !== undefined && { states: this._meta.states }),
      ...(this._meta.capabilities !== undefined && { capabilities: this._meta.capabilities }),
      sections,
    }
  }

  get page(): SurfaicePage | null {
    return this.toSurfaicePage()
  }

  reset(): void {
    this._meta = null
    this._sectionNames = []
    this._pendingElements = []
    this._currentSectionName = null
  }
}
