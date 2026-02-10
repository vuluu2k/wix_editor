<template>
  <div>
    <template v-if="!store.selectedNode">
      <div class="text-gray-400 text-sm text-center py-8 px-4">
        Select an element to edit its properties
      </div>
    </template>
    <template v-else>
      <!-- Node info header -->
      <div class="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
        <div class="text-gray-800 text-sm font-bold flex items-center justify-between">
          <span>{{ store.selectedNode.meta?.name || store.selectedNode.type }}</span>
          <span class="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
            {{ store.selectedNode.type }}
          </span>
        </div>
        <div class="text-gray-400 text-[10px] mt-1 font-mono opacity-60">
          ID: {{ store.selectedNode.id.split('-')[0] }}...
        </div>
      </div>

      <!-- Inspector Sections -->
      <div class="overflow-y-auto h-[calc(100%-60px)]">
        <InspectorSection
          v-for="(section, idx) in inspectorSections"
          :key="section.title + idx"
          :title="section.title"
          :default-open="idx === 0"
        >
          <InspectorForm
            :fields="section.fields"
            :values="getSectionValues(section)"
            @update="handleUpdate"
          />
        </InspectorSection>
        
        <div v-if="inspectorSections.length === 0" class="p-4 text-center text-gray-400 text-xs">
          No settings available
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/core/store/editor.store'
import { getComponent } from '@/core/registry'
import { mergeStyles } from '@/core/renderer/styleMerge'
import InspectorForm from '@/ui/InspectorForm.vue'
import InspectorSection from '@/ui/InspectorSection.vue'
import type { InspectorSection as InspectorSectionType } from '@/core/types/registry'
import type { InspectorField } from '@/core/types/inspector'

const store = useEditorStore()

const inspectorSections = computed<InspectorSectionType[]>(() => {
  if (!store.selectedNode) return []
  const entry = getComponent(store.selectedNode.type)
  return entry ? entry.inspector : []
})

function getSectionValues(section: InspectorSectionType): Record<string, unknown> {
  if (!store.selectedNode) return {}
  
  const values: Record<string, unknown> = {}
  const computedStyles = mergeStyles(store.selectedNode.styles, store.activeBreakpoint)

  for (const field of section.fields) {
    if (field.target === 'props') {
      values[field.key] = store.selectedNode.props[field.key]
    } else {
      values[field.key] = computedStyles[field.key]
    }
  }
  return values
}

function handleUpdate(payload: { key: string; value: unknown; target: 'props' | 'style' | 'layout' }): void {
  if (!store.selectedNodeId) return

  if (payload.target === 'props') {
    store.doUpdateProps(store.selectedNodeId, { [payload.key]: payload.value })
  } else if (payload.target === 'layout') {
    // Layout updates handled via props for now
    store.doUpdateProps(store.selectedNodeId, { layout: payload.value })
  } else if (payload.target === 'style') {
    store.doUpdateStyles(
      store.selectedNodeId,
      { [payload.key]: payload.value as string | number },
      store.activeBreakpoint
    )
  }
}
</script>
