export type InspectorField =
  | { type: 'text'; key: string; label: string; target: 'props' | 'style' }
  | { type: 'number'; key: string; label: string; unit?: 'px' | '%'; target: 'props' | 'style' }
  | { type: 'color'; key: string; label: string; target: 'props' | 'style' }
  | {
      type: 'select'
      key: string
      label: string
      options: { label: string; value: string }[]
      target: 'props' | 'style'
    }
