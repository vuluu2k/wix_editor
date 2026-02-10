import { h } from 'vue'
import type { ComponentRegistryEntry } from '@/core/types/registry'

export const sectionComponent: ComponentRegistryEntry = {
  type: 'section',
  label: 'Section',
  category: 'Layout',
  defaultProps: {},
  defaultStyles: {
    width: '100%',
    minHeight: '400px',
    position: 'relative',
    padding: '0px',
  },
  inspector: [
    {
      title: 'Section',
      fields: [
        { type: 'text', key: 'name', label: 'Section Name' },
        { type: 'number', key: 'minHeight', label: 'Min Height', unit: 'px', target: 'style' },
      ],
    },
    {
      title: 'Design',
      fields: [
        { type: 'color', key: 'backgroundColor', label: 'Background Color', target: 'style' },
      ],
    },
  ],
  render: (_node, _ctx) => {
    return h('div')
  },
}
