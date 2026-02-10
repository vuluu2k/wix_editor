import { h } from 'vue'
import type { ComponentRegistryEntry } from '@/core/types/registry'

export const buttonComponent: ComponentRegistryEntry = {
  type: 'button',
  label: 'Button',
  category: 'Buttons',
  defaultProps: {
    label: 'Button',
  },
  defaultStyles: {
    padding: '10px 20px',
    backgroundColor: '#4361ee',
    color: '#ffffff',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: 'fit-content',
  },
  inspector: [
    {
      title: 'Content',
      fields: [
        { type: 'text', key: 'label', label: 'Label', target: 'props' },
      ],
    },
    {
      title: 'Design',
      fields: [
        { type: 'color', key: 'backgroundColor', label: 'Background', target: 'style' },
        { type: 'color', key: 'color', label: 'Text Color', target: 'style' },
        { type: 'number', key: 'borderRadius', label: 'Radius', unit: 'px', target: 'style' },
        { type: 'text', key: 'border', label: 'Border', target: 'style' },
        { type: 'number', key: 'width', label: 'Width', unit: 'px', target: 'style' },
        { type: 'number', key: 'fontSize', label: 'Font Size', unit: 'px', target: 'style' },
        { type: 'number', key: 'padding', label: 'Padding', unit: 'px', target: 'style' },
      ],
    },
    {
      title: 'Interactions',
      fields: [
        { type: 'text', key: 'onClick', label: 'On Click Handler', target: 'props' },
      ],
    },
  ],
  render: (node, _ctx) => {
    const label = (node.props.label as string) || 'Button'
    return h('button', {}, label)
  },
}
