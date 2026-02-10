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

// ─── Root: vertical section stack ────────────────────────
const rootNode = createNode({
  id: 'root-1',
  type: 'container',
  parentId: null,
  children: ['section-hero', 'section-content'],
  props: {},
  styles: {
    base: {
      width: '100%',
      minHeight: '600px',
    },
  },
  layoutMode: 'flow',
  meta: { name: 'Page Root' },
})

// ─── Section: Hero ───────────────────────────────────────
const heroSection = createNode({
  id: 'section-hero',
  type: 'section',
  parentId: 'root-1',
  children: ['text-1', 'button-1'],
  props: {},
  styles: {
    base: {
      width: '100%',
      minHeight: '400px',
      backgroundColor: '#f8fafc',
    },
  },
  layoutMode: 'flow',
  meta: { name: 'Hero Section' },
})

// ─── Section: Content ────────────────────────────────────
const contentSection = createNode({
  id: 'section-content',
  type: 'section',
  parentId: 'root-1',
  children: ['text-2'],
  props: {},
  styles: {
    base: {
      width: '100%',
      minHeight: '300px',
      backgroundColor: '#ffffff',
    },
  },
  layoutMode: 'flow',
  meta: { name: 'Content Section' },
})

// ─── Elements inside Hero ────────────────────────────────
const textNode = createNode({
  id: 'text-1',
  type: 'text',
  parentId: 'section-hero',
  children: [],
  props: { content: 'Hello, World! Welcome to Wix Editor.' },
  styles: {
    base: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1a1a2e',
    },
  },
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
  parentId: 'section-hero',
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

// ─── Elements inside Content ─────────────────────────────
const contentText = createNode({
  id: 'text-2',
  type: 'text',
  parentId: 'section-content',
  children: [],
  props: { content: 'This is a content section. Add more elements here.' },
  styles: {
    base: {
      fontSize: '16px',
      color: '#64748b',
    },
  },
  grid: {
    base: {
      colStart: 1,
      colSpan: 8,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 30,
    },
  },
  layoutMode: 'flow',
  meta: { name: 'Content Text' },
})

export const demoDocument: DocumentModel = {
  rootId: 'root-1',
  nodes: {
    'root-1': rootNode,
    'section-hero': heroSection,
    'section-content': contentSection,
    'text-1': textNode,
    'button-1': buttonNode,
    'text-2': contentText,
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
