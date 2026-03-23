import type { SurfaicePage, Section, Element } from '@surfaice/format'
import type {
  DiscoveredRoute,
  ParsedPage,
  ExtractedElement,
  SurfaiceTag,
  MappedAction,
} from '../types.js'

export interface GeneratorInput {
  route: DiscoveredRoute
  page: ParsedPage
  tags: SurfaiceTag[]
  mappedActions: MappedAction[]
}

/**
 * Convert a route path to a .surfaice.md filename.
 * "/" → "index.surfaice.md"
 * "/login" → "login.surfaice.md"
 * "/dashboard/settings" → "dashboard-settings.surfaice.md"
 * "/novels/:id" → "novels-_id.surfaice.md"
 */
export function routeToFilename(route: string): string {
  if (route === '/') return 'index.surfaice.md'
  const slug = route
    .slice(1)                         // strip leading /
    .replace(/:/g, '_')               // :id → _id
    .replace(/\//g, '-')              // / → -
  return `${slug}.surfaice.md`
}

/**
 * Build a format Element from an ExtractedElement + optional MappedAction.
 */
function buildElement(
  el: ExtractedElement,
  action?: MappedAction
): Element {
  const formatEl: Element = {
    id: el.id,
    type: el.type,
    label: el.label || el.id,
  }

  if (el.attributes.length > 0) {
    formatEl.attributes = el.attributes
  }

  // Wire mapped action onto this element
  if (action) {
    formatEl.action = action.action
    if (action.result) formatEl.result = action.result
  }

  // Navigation for links
  if (el.navigatesTo) {
    formatEl.navigates = el.navigatesTo
  }

  // accepts hint for textbox inputs
  if (el.type === 'textbox' && el.inputType) {
    formatEl.accepts = el.inputType
  }

  return formatEl
}

/**
 * Group ExtractedElements into sections.
 *
 * Strategy:
 * 1. Elements with containingForm → group by form id → one section per form
 * 2. Link elements not in a form → "Navigation" section
 * 3. Remaining elements → "Main" section
 *
 * For anonymous forms (containingForm starts with "__form_"), use the handler
 * name as a human-readable section label.
 */
function groupIntoSections(
  elements: ExtractedElement[],
  actionMap: Map<string, MappedAction>
): Section[] {
  const formGroups = new Map<string, ExtractedElement[]>()
  const navElements: ExtractedElement[] = []
  const mainElements: ExtractedElement[] = []

  for (const el of elements) {
    if (el.containingForm) {
      const group = formGroups.get(el.containingForm) ?? []
      group.push(el)
      formGroups.set(el.containingForm, group)
    } else if (el.type === 'link') {
      navElements.push(el)
    } else {
      mainElements.push(el)
    }
  }

  const sections: Section[] = []

  // Form sections
  for (const [formId, formEls] of formGroups) {
    const sectionName = formIdToSectionName(formId)
    sections.push({
      name: sectionName,
      elements: formEls.map(el => buildElement(el, actionMap.get(el.id))),
    })
  }

  // Main section (non-form, non-link elements)
  if (mainElements.length > 0) {
    sections.push({
      name: 'Main',
      elements: mainElements.map(el => buildElement(el, actionMap.get(el.id))),
    })
  }

  // Navigation section
  if (navElements.length > 0) {
    sections.push({
      name: 'Navigation',
      elements: navElements.map(el => buildElement(el, actionMap.get(el.id))),
    })
  }

  // Fallback: if nothing grouped, put all in Main
  if (sections.length === 0 && elements.length > 0) {
    sections.push({
      name: 'Main',
      elements: elements.map(el => buildElement(el, actionMap.get(el.id))),
    })
  }

  return sections
}

/**
 * Convert a form id to a human-readable section name.
 * "login-form" → "Login Form"
 * "__form_handleUpdate" → "Update Form"
 * "profile-form" → "Profile Form"
 */
function formIdToSectionName(formId: string): string {
  // Anonymous form: "__form_handleSubmit" → "Submit Form"
  if (formId.startsWith('__form_')) {
    const handler = formId.slice('__form_'.length)
    // handleUpdate → "Update", handleLogin → "Login"
    const verb = handler
      .replace(/^handle/i, '')
      .replace(/([A-Z])/g, ' $1')
      .trim()
    return verb ? `${verb} Form` : 'Form'
  }
  // Named form: "login-form" → "Login Form", "profile-section" → "Profile Section"
  return formId
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Generate a SurfaicePage from all analysis stages.
 */
export function generateManifest(input: GeneratorInput): SurfaicePage {
  const { route, page, mappedActions } = input

  // Build a fast lookup: elementId → MappedAction
  const actionMap = new Map<string, MappedAction>()
  for (const action of mappedActions) {
    actionMap.set(action.elementId, action)
  }

  const sections = groupIntoSections(page.elements, actionMap)

  return {
    version: 'v1',
    route: route.route,
    states: page.hasAuthGuard ? ['auth-required'] : [],
    sections,
  }
}
