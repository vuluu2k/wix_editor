<template>
  <div
    v-if="visible"
    class="absolute inset-0 pointer-events-none z-10"
  >
    <!-- Left margin boundary (dashed vertical line) -->
    <div
      class="absolute top-0 bottom-0"
      :style="{
        left: `${contentLeft}px`,
        width: '0px',
        borderLeft: '1px dashed rgba(0, 0, 0, 0.15)',
      }"
    />
    <!-- Right margin boundary (dashed vertical line) -->
    <div
      class="absolute top-0 bottom-0"
      :style="{
        left: `${contentRight}px`,
        width: '0px',
        borderLeft: '1px dashed rgba(0, 0, 0, 0.15)',
      }"
    />

    <!-- Column boundary lines (dashed) inside content area -->
    <template v-for="(line, index) in columnBoundaryLines" :key="'col-' + index">
      <div
        class="absolute top-0 bottom-0"
        :style="{
          left: `${line}px`,
          width: '0px',
          borderLeft: '1px dashed rgba(0, 0, 0, 0.08)',
        }"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { computeGrid } from './gridEngine'
import type { GridConfig } from '@/core/types/grid'

const props = defineProps<{
  config: GridConfig
  containerWidth: number
  visible: boolean
}>()

const grid = computed(() => computeGrid(props.config, props.containerWidth))

// Content area boundaries (the 1200px center)
const contentLeft = computed(() => {
  const cols = grid.value.columns
  if (!cols.length) return 0
  return cols[0].x
})

const contentRight = computed(() => {
  const cols = grid.value.columns
  if (!cols.length) return props.containerWidth
  const last = cols[cols.length - 1]
  return last.x + last.width
})

// All internal column boundary lines (between columns, inside content area)
const columnBoundaryLines = computed(() => {
  const cols = grid.value.columns
  if (cols.length <= 1) return []
  
  const lines: number[] = []
  for (let i = 0; i < cols.length; i++) {
    // Right edge of each column (except last — it's the contentRight)
    if (i < cols.length - 1) {
      lines.push(cols[i].x + cols[i].width) // right edge
      lines.push(cols[i + 1].x) // left edge of next (after gutter)
    }
  }
  return lines
})
</script>
