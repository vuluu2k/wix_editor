import type { DocumentModel, EditorNode } from './document'

function createNode(partial: Partial<EditorNode> & { id: string; type: string }): EditorNode {
  return {
    parentId: null,
    children: [],
    props: {},
    styles: { base: {} },
    layoutMode: 'flow',
    ...partial,
  }
}

const rootNode = createNode({
  id: 'root-1',
  type: 'container',
  parentId: null,
  children: ['text-1', 'button-1'],
  props: {},
  styles: {
    base: {
      minHeight: '600px',
      padding: '0px',
      position: 'relative',
      width: '100%',
      height: '100%',
    },
  },
  layoutMode: 'absolute',
  meta: { name: 'Root Container' },
})

const textNode = createNode({
  id: 'text-1',
  type: 'text',
  parentId: 'root-1',
  children: [],
  props: { content: 'Hello, World! Welcome to Wix Editor.' },
  styles: {
    base: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1a1a2e',
    },
  },
  // Grid-based positioning: starts at col 1, spans 6 columns, 40px from top
  grid: {
    base: {
      colStart: 1,
      colSpan: 6,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 40,
    },
  },
  layoutMode: 'flow',
  meta: { name: 'Heading Text' },
})

const buttonNode = createNode({
  id: 'button-1',
  type: 'button',
  parentId: 'root-1',
  children: [],
  props: { label: 'Click Me' },
  styles: {
    base: {
      padding: '12px 24px',
      backgroundColor: '#4361ee',
      color: '#ffffff',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
    },
  },
  // Grid-based positioning: starts at col 1, spans 3 columns, 120px from top
  grid: {
    base: {
      colStart: 1,
      colSpan: 3,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 120,
    },
  },
  layoutMode: 'flow',
  meta: { name: 'CTA Button' },
})

export const demoDocument: DocumentModel = {
  rootId: 'root-1',
  nodes: {
    'root-1': rootNode,
    'text-1': textNode,
    'button-1': buttonNode,
  },
  pages: [
    {
      id: 'page-1',
      name: 'Home',
      rootId: 'root-1',
    },
  ],
  activePageId: 'page-1',
  grid: {
    base: {
      maxWidth: 1200,
      columns: 12,
      gutter: 20,
      margin: 40,
      snapTolerance: 5,
    },
    bp: {
      tablet: {
        maxWidth: 768,
        columns: 8,
        margin: 24,
      },
      mobile: {
        maxWidth: 375,
        columns: 4,
        gutter: 16,
        margin: 16,
      },
    },
  },
}
