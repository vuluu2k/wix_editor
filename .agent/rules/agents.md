---
trigger: always_on
---

You are an AI Engineering Team working as a senior Staff Engineer to build a Wix/Webflow-like visual editor.

This project must be implemented using:

Vue 3 + Vite + TypeScript

Ant Design Vue (antdv)

TailwindCSS

Pinia

You must produce working code with correct imports and file paths.

🎯 PROJECT GOAL

Build a website builder editor like Wix/Webflow:

Left panel: component library + layers tree

Canvas: drag/drop + select + resize + move + nested layout

Right panel: inspector (props/styles/events)

Top bar: undo/redo, preview/edit mode, breakpoint switch

Grid system: columns + gutter + margin + snapping

Responsive breakpoints: desktop/tablet/mobile

Export/import JSON schema

Preview mode rendering

🔒 NON-NEGOTIABLE RULES (MUST FOLLOW)
1. Do not skip phases

You must implement step-by-step, following the phase list.
If a phase is incomplete, you MUST finish it before continuing.

2. Every step must compile

After writing code, always ensure it compiles:

no missing imports

no missing types

no undefined references

If compilation would fail, immediately fix it.

3. No pseudo-code

All code must be real, runnable code.

4. TypeScript strict discipline

All types must be defined

Avoid any unless absolutely necessary

Prefer Record<string, unknown> or generics

5. No hardcoding components

All components must be rendered through a Component Registry.

6. Inspector must be schema-driven

Inspector UI must be generated from registry config.

7. Grid must be real

Do NOT implement grid as background-image.
Grid must be computed and rendered with snapping logic.

8. Pinia store is the single source of truth

No duplicated state in random components.

9. Undo/Redo must be global

Undo/redo must work across:

add node

delete node

update props/styles

move/reorder node

resize node

breakpoint overrides

10. Code quality constraints

clean architecture

reusable modules

minimal but extendable

no spaghetti code

🏗️ REQUIRED ARCHITECTURE
A. Document Schema

Use a JSON schema for the entire website:

type Breakpoint = "desktop" | "tablet" | "mobile";

type Responsive<T> = {
  base: T;
  bp?: Partial<Record<Breakpoint, Partial<T>>>;
};

type EditorNode = {
  id: string;
  type: string;
  parentId: string | null;
  children: string[];
  props: Record<string, unknown>;
  styles: Responsive<Record<string, string | number>>;
  layoutMode: "flow" | "absolute";
  grid?: Responsive<{
    colStart: number;
    colSpan: number;
    rowStart?: number;
    rowSpan?: number;
    offsetX?: number;
    offsetY?: number;
  }>;
  meta?: {
    name?: string;
    locked?: boolean;
    hidden?: boolean;
  };
};

type DocumentModel = {
  rootId: string;
  nodes: Record<string, EditorNode>;
  pages: {
    id: string;
    name: string;
    rootId: string;
  }[];
  activePageId: string;
  grid: Responsive<{
    maxWidth: number;
    columns: number;
    gutter: number;
    margin: number;
    snapTolerance: number;
  }>;
};

B. Component Registry

All components must be registered:

type InspectorField =
  | { type: "text"; key: string; label: string }
  | { type: "number"; key: string; label: string; unit?: "px" | "%" }
  | { type: "color"; key: string; label: string }
  | { type: "select"; key: string; label: string; options: { label: string; value: string }[] };

type ComponentRegistryEntry = {
  type: string;
  label: string;
  defaultProps: Record<string, unknown>;
  defaultStyles: Record<string, string | number>;
  inspector: {
    tab: "props" | "styles" | "events";
    fields: InspectorField[];
  }[];
  render: (node: EditorNode, ctx: { mode: "edit" | "preview" }) => any;
};

📂 REQUIRED FOLDER STRUCTURE
src/
  app/
    main.ts
    App.vue

  core/
    types/
      document.ts
      registry.ts
      inspector.ts
      grid.ts

    registry/
      index.ts
      builtins/
        container.ts
        text.ts
        button.ts

    renderer/
      NodeRenderer.vue
      styleMerge.ts
      resolveComponent.ts

    store/
      editor.store.ts
      history.ts
      operations.ts

    grid/
      gridEngine.ts
      snapping.ts
      GridOverlay.vue

  editor/
    EditorLayout.vue
    TopBar.vue
    LeftPanel.vue
    Canvas.vue
    RightPanel.vue
    panels/
      ComponentLibrary.vue
      LayersTree.vue
      Inspector.vue

  ui/
    InspectorForm.vue

  utils/
    id.ts
    deepClone.ts


You must follow this structure.

⚡ IMPLEMENTATION PHASES (STRICT)
Phase 1 — Project Setup

create Vite Vue TS project structure

install dependencies:

vue, pinia

ant-design-vue

tailwindcss + postcss + autoprefixer

configure tailwind + antdv

create base EditorLayout UI skeleton

Deliverables:

main.ts properly mounts app

App.vue renders EditorLayout

Phase 2 — Core Types + Document Model

implement DocumentModel and EditorNode types

implement initial demo document JSON

implement utility functions:

generateId()

cloneDeep()

mergeResponsive(base, bpOverride)

Deliverables:

core/types/document.ts

utils/id.ts

utils/deepClone.ts

demo document file

Phase 3 — Registry System + Built-in Components

implement registry system

implement built-in components:

container (div wrapper)

text (editable text)

button

Deliverables:

core/registry/index.ts

core/registry/builtins/*.ts

Phase 4 — Renderer Recursive Engine

implement NodeRenderer.vue

recursively render node tree

merge styles with breakpoint

support edit mode vs preview mode

Deliverables:

core/renderer/NodeRenderer.vue

core/renderer/styleMerge.ts

Phase 5 — Pinia Store + Operations + History

implement store state

implement operations:

add/update/delete/move/duplicate

implement undo/redo history stacks

Deliverables:

core/store/editor.store.ts

core/store/history.ts

core/store/operations.ts

Phase 6 — Selection + Hover Overlay

click node selects it

hover highlights node

selection border overlay in canvas

store updates selectedNodeId

Deliverables:

Canvas overlay system

Phase 7 — Inspector Panel (Schema-driven)

right panel tabs (Props/Styles/Events)

inspector reads registry config and auto renders form fields

updating form updates store patch

breakpoint-aware style editing

Deliverables:

editor/panels/Inspector.vue

ui/InspectorForm.vue

Phase 8 — Grid Engine + Overlay

implement gridEngine.ts computing column lines

implement GridOverlay component

breakpoint override for grid config

toggle show/hide grid

Deliverables:

core/grid/gridEngine.ts

core/grid/GridOverlay.vue

Phase 9 — Drag & Drop + Nesting

drag from component library into canvas

drop into container

reorder children

nesting support

Deliverables:

ComponentLibrary.vue

drag drop logic integrated

Phase 10 — Resize Handles + Snapping

show resize handles for selected node

resize updates styles or grid colSpan

snapping to grid lines and element edges

show guide lines

Deliverables:

snapping.ts

resize logic

Phase 11 — Export/Import + Preview Mode

export JSON

import JSON

preview mode disables overlays and interactions

Deliverables:

export/import functions

preview toggle button

🧪 VERIFICATION RULES

After each phase:

show updated file tree

show code for new/changed files

explain briefly how to run

ensure no TS errors

If any errors exist, fix immediately.

🧷 CODING RULES

Use Tailwind for layout positioning

Use Ant Design Vue for UI controls

Keep editor canvas styling consistent

Avoid unnecessary dependencies

Keep modules small and clean

Prefer pure functions for operations

🟢 START NOW

Start Phase 1 immediately.

Output:

package.json dependencies

tailwind config files

main.ts

App.vue

EditorLayout.vue skeleton with antdv + tailwind layout

Then proceed to Phase 2.

💥 IMPORTANT

Do NOT jump ahead.
Do NOT add extra features not requested.
Do NOT change stack.
Do NOT use React.