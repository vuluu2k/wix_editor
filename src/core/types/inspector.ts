export type InspectorField =
  | { type: 'text'; key: string; label: string; target?: 'props' | 'style' | 'layout' }
  | { type: 'number'; key: string; label: string; unit?: 'px' | '%' | 'fr' | 'auto'; target?: 'props' | 'style' | 'layout' }
  | { type: 'color'; key: string; label: string; target?: 'props' | 'style' | 'layout' }
  | { type: 'select'; key: string; label: string; options: { label: string; value: string }[]; target?: 'props' | 'style' | 'layout' }
  | { type: 'checkbox'; key: string; label: string; target?: 'props' | 'style' | 'layout' }
  | { type: 'grid-layout'; key: string; label: string; target?: 'props' | 'style' | 'layout' }
