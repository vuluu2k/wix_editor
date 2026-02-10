import type { EditorNode } from './document'
import type { InspectorField } from './inspector'
import type { VNode } from 'vue'

export interface InspectorSection {
  title: string
  fields: InspectorField[]
}

export interface ComponentRegistryEntry {
  type: string
  label: string
  defaultProps: Record<string, unknown>
  defaultStyles: Record<string, string | number>
  category: string
  inspector: InspectorSection[]
  render: (node: EditorNode, ctx: { mode: 'edit' | 'preview' }) => VNode | string
}
