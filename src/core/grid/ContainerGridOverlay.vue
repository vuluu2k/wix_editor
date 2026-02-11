<template>
  <div class="absolute inset-0 pointer-events-none z-10 container-grid-overlay">
    <!-- Vertical Column Lines -->
    <template v-for="(col, i) in grid.columns" :key="'col-' + i">
       <!-- Left edge of column -->
       <div 
         class="absolute top-0 bottom-0 border-l border-dashed border-blue-300/50"
         :style="{ left: `${col.x}px` }"
       />
       <!-- Right edge of column -->
       <div 
         class="absolute top-0 bottom-0 border-l border-dashed border-blue-300/50"
         :style="{ left: `${col.x + col.width}px` }"
       />
    </template>

    <!-- Horizontal Row Lines -->
    <template v-for="(row, i) in grid.rows" :key="'row-' + i">
       <!-- Top edge of row -->
       <div 
         class="absolute left-0 right-0 border-t border-dashed border-blue-300/50"
         :style="{ top: `${row.x}px` }"
       />
       <!-- Bottom edge of row -->
       <div 
         class="absolute left-0 right-0 border-t border-dashed border-blue-300/50"
         :style="{ top: `${row.x + row.width}px` }"
       />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ComputedContainerGrid } from './gridEngine'

defineProps<{
  grid: ComputedContainerGrid
}>()
</script>

<style scoped>
.container-grid-overlay {
  /* Ensure it doesn't block interactions */
  pointer-events: none;
}
</style>
