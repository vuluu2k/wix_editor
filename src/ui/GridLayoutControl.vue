<template>
  <div class="flex flex-col gap-3 p-2 bg-gray-50 rounded border border-gray-200">
    <!-- Grid Type Selector (future expansion for Masonry etc, currently just Grid) -->
    
    <!-- Columns & Rows -->
    <div class="grid grid-cols-2 gap-2">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Columns</label>
        <a-input-number
          :value="parsedCols"
          size="small"
          :min="1"
          :max="12"
          class="w-full"
          @change="updateCols"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Rows</label>
        <a-input-number
          :value="parsedRows"
          size="small"
          :min="1"
          :max="12"
          class="w-full"
          @change="updateRows"
        />
      </div>
    </div>

    <!-- Gaps -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-gray-500">Gap (px)</label>
      <div class="grid grid-cols-2 gap-2">
        <a-input-number
          :value="layout.colGap ?? layout.gap ?? 0"
          size="small"
          :min="0"
          placeholder="Col"
          class="w-full"
          addon-before="↔"
          @change="(val: number | null) => updateGap('col', val)"
        />
        <a-input-number
          :value="layout.rowGap ?? layout.gap ?? 0"
          size="small"
          :min="0"
          placeholder="Row"
          class="w-full"
          addon-before="↕"
          @change="(val: number | null) => updateGap('row', val)"
        />
      </div>
    </div>
    
    <!-- Padding (Optional, nice to have for grid containers) -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-gray-500">Padding (px)</label>
      <a-input-number
          :value="layout.padding?.top ?? 0"
          size="small"
          :min="0"
          class="w-full"
          @change="(val: number | null) => updatePadding(val)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: Record<string, any> | undefined
}>()

const emit = defineEmits<{
  (e: 'update', value: Record<string, any>): void
}>()

const layout = computed(() => {
    const val = props.value || {}
    return {
        type: 'grid',
        cols: val.cols ?? 1,
        rows: val.rows ?? 1,
        gap: val.gap ?? 0,
        rowGap: val.rowGap,
        colGap: val.colGap,
        padding: val.padding ?? { top: 20, right: 20, bottom: 20, left: 20 }
    }
})

const parsedCols = computed(() => {
  const c = layout.value.cols
  if (typeof c === 'number') return c
  return 1 
})

const parsedRows = computed(() => {
  const r = layout.value.rows
  if (typeof r === 'number') return r
  return 1
})

function updateCols(val: number | null) {
  if (!val) return
  emit('update', { ...layout.value, cols: val })
}

function updateRows(val: number | null) {
  if (!val) return
  emit('update', { ...layout.value, rows: val })
}

function updateGap(type: 'col' | 'row', val: number | null) {
  if (val === null) return
  const newLayout = { ...layout.value }
  
  // Normalize gap structure
  if (typeof newLayout.gap === 'number') {
      newLayout.rowGap = newLayout.gap
      newLayout.colGap = newLayout.gap
      delete (newLayout as any).gap
  }

  if (type === 'col') newLayout.colGap = val
  if (type === 'row') newLayout.rowGap = val
  
  emit('update', newLayout)
}

function updatePadding(val: number | null) {
    if (val === null) return
    const p = val
    emit('update', { ...layout.value, padding: { top: p, right: p, bottom: p, left: p } })
}
</script>
