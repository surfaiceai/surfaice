// @surfaice/format — Core type definitions
// These types form the AST that everything else produces and consumes.

export type ElementType =
  | 'button'
  | 'textbox'
  | 'textarea'
  | 'link'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'slider'
  | 'image'
  | 'image-upload'
  | 'badge'
  | 'heading'
  | 'text'
  | 'list'

export interface Capability {
  /** Unique identifier for this capability, e.g. "update-profile" */
  id: string
  /** Human-readable description, e.g. "User updates their display name" */
  description: string
  /** Element IDs involved in this capability */
  elements: string[]
}

export interface StateChange {
  /** The element ID this change applies to */
  elementId: string
  /** '+' = add/show, '-' = remove/hide, '~' = modify */
  modifier: '+' | '-' | '~'
  /** Description of what changes, e.g. "disabled, shows spinner" */
  description: string
}

export interface PageState {
  /** State name, e.g. "loading", "error", "success" */
  name: string
  changes: StateChange[]
}

export interface Element {
  /** Unique identifier within this page, e.g. "save" */
  id: string
  /** Element type */
  type: ElementType
  /** Human-readable label, e.g. "Save Changes" */
  label: string
  /** Optional modifiers: "readonly", "required", "destructive" */
  attributes?: string[]
  /** HTTP action, e.g. "PUT /api/profile" */
  action?: string
  /** Side-effect after action, e.g. "toast 'Saved!'" */
  result?: string
  /** Route this element navigates to */
  navigates?: string
  /** Elements revealed after interaction with this element */
  reveals?: Element[]
  /** Runtime live value (injected at render time), e.g. "Haosu Wu" */
  value?: string
  /** Template binding for static export, e.g. "{user.name}" */
  current?: string
  /** Input type hint for textboxes, e.g. "email", "string" */
  accepts?: string
  /** Options for select elements */
  options?: string[]
  /** Value displayed by display elements (e.g. badge count), e.g. "{notifications.count}" */
  shows?: string
}

export interface Section {
  /** Section name, e.g. "Profile Section" */
  name: string
  elements: Element[]
}

export interface SurfaicePage {
  /** Format version, always "v1" for now */
  version: string
  /** Route this page corresponds to, e.g. "/settings" */
  route: string
  /** Optional human-readable page name */
  name?: string
  /** Page-level states that gate access, e.g. ["auth-required"] */
  states?: string[]
  /** Named capabilities grouping elements into user flows */
  capabilities?: Capability[]
  /** Ordered list of UI sections */
  sections: Section[]
  /** Optional state machine describing UI state transitions */
  pageStates?: PageState[]
}

export interface ValidationError {
  /** Machine-readable error code */
  code: string
  /** Human-readable message */
  message: string
  /** Optional path to the offending node, e.g. "sections[0].elements[2].id" */
  path?: string
}
