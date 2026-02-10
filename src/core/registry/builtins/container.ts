import { h } from 'vue'
import type { ComponentRegistryEntry } from '@/core/types/registry'

export const containerComponent: ComponentRegistryEntry = {
  type: 'container',
  label: 'Container',
  category: 'Layout',
  defaultProps: {},
  defaultStyles: {
    minHeight: '100px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inspector: [
    {
      title: 'Layout',
      fields: [
        { type: 'number', key: 'minHeight', label: 'Min Height', unit: 'px', target: 'style' },
        { type: 'number', key: 'padding', label: 'Padding', unit: 'px', target: 'style' },
        { type: 'number', key: 'gap', label: 'Gap', unit: 'px', target: 'style' },
        {
          type: 'select',
          key: 'flexDirection',
          label: 'Direction',
          options: [
            { label: 'Column', value: 'column' },
            { label: 'Row', value: 'row' },
          ],
          target: 'style',
        },
        {
          type: 'select',
          key: 'alignItems',
          label: 'Align Items',
          options: [
            { label: 'Stretch', value: 'stretch' },
            { label: 'Start', value: 'flex-start' },
            { label: 'Center', value: 'center' },
            { label: 'End', value: 'flex-end' },
          ],
          target: 'style',
        },
        {
          type: 'select',
          key: 'justifyContent',
          label: 'Justify Content',
          options: [
            { label: 'Start', value: 'flex-start' },
            { label: 'Center', value: 'center' },
            { label: 'End', value: 'flex-end' },
            { label: 'Space Between', value: 'space-between' },
            { label: 'Space Around', value: 'space-around' },
          ],
          target: 'style',
        },
      ],
    },
    {
      title: 'Design',
      fields: [
        { type: 'color', key: 'backgroundColor', label: 'Background Color', target: 'style' },
        { type: 'number', key: 'borderRadius', label: 'Border Radius', unit: 'px', target: 'style' },
      ],
    },
  ],
  render: (_node, _ctx) => {
    return h('div')
  },
}
