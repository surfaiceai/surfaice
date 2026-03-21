export interface DiffElement {
  id: string
  type: string
  label: string
  section: string
}

export interface DiffChange {
  id: string
  section: string
  /** Which field changed: 'label', 'type', 'action', 'attributes', etc. */
  field: string
  expected: string
  actual: string
}

export interface SurfaiceDiff {
  route: string
  status: 'match' | 'drift'
  added: DiffElement[]
  removed: DiffElement[]
  changed: DiffChange[]
  /** Human-readable one-liner summary */
  summary: string
}
