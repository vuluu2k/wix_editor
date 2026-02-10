<template>
  <div
    v-if="visible"
    class="absolute inset-0 pointer-events-none z-10"
    :style="{ width: `${grid.containerWidth}px` }"
  >
    <!-- Column overlays -->
    <div
      v-for="(col, index) in grid.columns"
      :key="index"
      class="absolute top-0 bottom-0"
      :style="{
        left: `${col.x}px`,
        width: `${col.width}px`,
        backgroundColor: 'rgba(59, 130, 246, 0.03)',
        borderLeft: '1px solid rgba(59, 130, 246, 0.1)',
        borderRight: '1px solid rgba(59, 130, 246, 0.1)',
      }"
    />
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
</script>
