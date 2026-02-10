<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="field in fields"
      :key="field.key"
      class="flex flex-col gap-1"
    >
      <label class="text-gray-400 text-xs font-medium">{{ field.label }}</label>

      <!-- Text input -->
      <a-input
        v-if="field.type === 'text'"
        :value="String(values[field.key] ?? '')"
        size="small"
        @change="(e: Event) => handleChange(field, (e.target as HTMLInputElement).value)"
      />

      <!-- Number input -->
      <a-input-number
        v-else-if="field.type === 'number'"
        :value="parseNumber(values[field.key])"
        size="small"
        class="w-full"
        :addon-after="field.unit || undefined"
        @change="(val: number | null) => handleNumberChange(field, val)"
      />

      <!-- Color input -->
      <div v-else-if="field.type === 'color'" class="flex items-center gap-2">
        <input
          type="color"
          :value="String(values[field.key] ?? '#000000')"
          class="w-8 h-8 rounded border border-gray-600 bg-transparent cursor-pointer"
          @input="(e: Event) => handleChange(field, (e.target as HTMLInputElement).value)"
        />
        <a-input
          :value="String(values[field.key] ?? '')"
          size="small"
          class="flex-1"
          @change="(e: Event) => handleChange(field, (e.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Select -->
      <a-select
        v-else-if="field.type === 'select'"
        :value="String(values[field.key] ?? '')"
        size="small"
        :options="field.options"
        @change="(val: string) => handleChange(field, val)"
      />

      <!-- Grid Layout Control -->
      <GridLayoutControl
        v-else-if="field.type === 'grid-layout'"
        :value="values[field.key] as Record<string, any>"
        @update="(val) => handleChange(field, val)"
      />
    </div>

    <div v-if="fields.length === 0" class="text-gray-500 text-xs text-center py-4">
      No fields available
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InspectorField } from '@/core/types/registry'
import GridLayoutControl from '@/ui/GridLayoutControl.vue' // Import the new control

const props = defineProps<{
  fields: InspectorField[]
  values: Record<string, unknown>
}>()

const emit = defineEmits<{
  update: [payload: { key: string; value: unknown; target: 'props' | 'style' | 'layout' }]
}>()

function handleChange(field: InspectorField, value: unknown): void {
  emit('update', { key: field.key, value, target: field.target || 'props' })
}

function handleNumberChange(field: InspectorField, val: number | null): void {
  if (val === null) return
  const unit = field.type === 'number' ? field.unit : undefined
  const value = unit ? `${val}${unit}` : val
  emit('update', { key: field.key, value, target: field.target || 'props' })
}

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined
  const str = String(value)
  const num = parseFloat(str)
  return isNaN(num) ? undefined : num
}
</script>
