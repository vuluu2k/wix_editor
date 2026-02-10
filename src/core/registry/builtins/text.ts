import { h } from 'vue'
import type { ComponentRegistryEntry } from '@/core/types/registry'

export const textComponent: ComponentRegistryEntry = {
  type: 'text',
  label: 'Text',
  category: 'Text',
  defaultProps: {
    content: 'Type something...',
  },
  defaultStyles: {
    fontSize: '16px',
    color: '#333333',
    lineHeight: '1.5',
  },
  inspector: [
    {
      title: 'Content',
      fields: [
        { type: 'text', key: 'content', label: 'Text Content', target: 'props' },
      ],
    },
    {
      title: 'Typography',
      fields: [
        { type: 'number', key: 'fontSize', label: 'Font Size', unit: 'px', target: 'style' },
        { type: 'color', key: 'color', label: 'Text Color', target: 'style' },
        {
          type: 'select',
          key: 'fontWeight',
          label: 'Font Weight',
          options: [
            { label: 'Normal', value: '400' },
            { label: 'Medium', value: '500' },
            { label: 'Semi Bold', value: '600' },
            { label: 'Bold', value: '700' },
          ],
          target: 'style',
        },
        {
          type: 'select',
          key: 'textAlign',
          label: 'Text Align',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
          target: 'style',
        },
        { type: 'number', key: 'lineHeight', label: 'Line Height', target: 'style' },
      ],
    },
  ],
  render: (node, ctx) => {
    const content = (node.props.content as string) || ''
    if (ctx.mode === 'edit') {
      return h('p', { contenteditable: true, innerHTML: content })
    }
    return h('p', {}, content)
  },
}
