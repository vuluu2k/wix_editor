<template>
  <div class="layout-control">
    <!-- Layout Preset Selector -->
    <div class="layout-section">
      <div class="section-label">Layout</div>
      <a-select
        :value="presetLabel"
        size="small"
        class="w-full"
        @change="applyPreset"
      >
        <a-select-option value="1x1">
          <span class="preset-icon">▦</span> 1×1
        </a-select-option>
        <a-select-option value="1x2">
          <span class="preset-icon">▦</span> 1×2
        </a-select-option>
        <a-select-option value="2x1">
          <span class="preset-icon">▦</span> 2×1
        </a-select-option>
        <a-select-option value="2x2">
          <span class="preset-icon">▦</span> 2×2
        </a-select-option>
        <a-select-option value="3x1">
          <span class="preset-icon">▦</span> 3×1
        </a-select-option>
        <a-select-option value="3x2">
          <span class="preset-icon">▦</span> 3×2
        </a-select-option>
        <a-select-option value="3x3">
          <span class="preset-icon">▦</span> 3×3
        </a-select-option>
        <a-select-option value="4x1">
          <span class="preset-icon">▦</span> 4×1
        </a-select-option>
        <a-select-option value="custom">
          <span class="preset-icon">▦</span> Custom
        </a-select-option>
      </a-select>
    </div>

    <!-- Columns -->
    <div class="layout-section">
      <div class="section-header">
        <span class="section-label">Columns ({{ columns.length }})</span>
        <div class="section-actions">
          <a-button size="small" type="text" @click="addColumn">
            <template #icon><PlusOutlined /></template>
          </a-button>
        </div>
      </div>
      <div class="track-list">
        <div
          v-for="(col, i) in columns"
          :key="'col-' + i"
          class="track-row"
        >
          <span class="track-index">{{ i + 1 }}</span>
          <a-input-number
            :value="col.value"
            size="small"
            :min="0"
            :step="col.unit === 'fr' ? 0.1 : 1"
            class="track-value"
            @change="(val: number | null) => updateTrack('columns', i, 'value', val)"
          />
          <a-select
            :value="col.unit"
            size="small"
            class="track-unit"
            @change="(val: string) => updateTrack('columns', i, 'unit', val)"
          >
            <a-select-option value="fr">fr</a-select-option>
            <a-select-option value="px">px</a-select-option>
            <a-select-option value="%">%</a-select-option>
            <a-select-option value="auto">auto</a-select-option>
          </a-select>
          <a-button
            v-if="columns.length > 1"
            size="small"
            type="text"
            class="track-delete"
            @click="removeTrack('columns', i)"
          >
            <template #icon><CloseOutlined /></template>
          </a-button>
        </div>
      </div>
    </div>

    <!-- Rows -->
    <div class="layout-section">
      <div class="section-header">
        <span class="section-label">Rows ({{ rows.length }})</span>
        <div class="section-actions">
          <a-button size="small" type="text" @click="addRow">
            <template #icon><PlusOutlined /></template>
          </a-button>
        </div>
      </div>
      <div class="track-list">
        <div
          v-for="(row, i) in rows"
          :key="'row-' + i"
          class="track-row"
        >
          <span class="track-index">{{ i + 1 }}</span>
          <a-input-number
            :value="row.value"
            size="small"
            :min="0"
            :step="row.unit === 'fr' ? 0.1 : 1"
            class="track-value"
            @change="(val: number | null) => updateTrack('rows', i, 'value', val)"
          />
          <a-select
            :value="row.unit"
            size="small"
            class="track-unit"
            @change="(val: string) => updateTrack('rows', i, 'unit', val)"
          >
            <a-select-option value="fr">fr</a-select-option>
            <a-select-option value="px">px</a-select-option>
            <a-select-option value="%">%</a-select-option>
            <a-select-option value="auto">auto</a-select-option>
          </a-select>
          <a-button
            v-if="rows.length > 1"
            size="small"
            type="text"
            class="track-delete"
            @click="removeTrack('rows', i)"
          >
            <template #icon><CloseOutlined /></template>
          </a-button>
        </div>
      </div>
    </div>

    <!-- Gaps -->
    <div class="layout-section">
      <div class="section-header">
        <span class="section-label">Gaps</span>
        <span class="unit-badge">px</span>
      </div>
      <div class="gap-row">
        <div class="gap-input">
          <span class="gap-icon">↔</span>
          <a-input-number
            :value="layout.colGap ?? 0"
            size="small"
            :min="0"
            class="gap-value"
            @change="(val: number | null) => updateField('colGap', val ?? 0)"
          />
          <span class="gap-unit">px</span>
        </div>
        <div class="gap-input">
          <span class="gap-icon">↕</span>
          <a-input-number
            :value="layout.rowGap ?? 0"
            size="small"
            :min="0"
            class="gap-value"
            @change="(val: number | null) => updateField('rowGap', val ?? 0)"
          />
          <span class="gap-unit">px</span>
        </div>
      </div>
    </div>

    <!-- Padding -->
    <div class="layout-section">
      <div class="section-header">
        <span class="section-label">Padding</span>
        <div class="section-actions">
          <span class="unit-badge">px</span>
          <a-button
            size="small"
            type="text"
            :class="{ 'link-active': paddingLinked }"
            @click="paddingLinked = !paddingLinked"
          >
            <template #icon><LinkOutlined /></template>
          </a-button>
        </div>
      </div>
      <div class="gap-row">
        <div class="gap-input">
          <span class="gap-icon">↔</span>
          <a-input-number
            :value="paddingH"
            size="small"
            :min="0"
            class="gap-value"
            @change="(val: number | null) => updatePadding('h', val ?? 0)"
          />
          <span class="gap-unit">px</span>
        </div>
        <div class="gap-input">
          <span class="gap-icon">↕</span>
          <a-input-number
            :value="paddingV"
            size="small"
            :min="0"
            class="gap-value"
            @change="(val: number | null) => updatePadding('v', val ?? 0)"
          />
          <span class="gap-unit">px</span>
        </div>
      </div>
    </div>

    <!-- Overflow -->
    <div class="layout-section">
      <div class="section-label">Overflow content</div>
      <a-select
        :value="layout.overflow ?? 'show'"
        size="small"
        class="w-full"
        @change="(val: string) => updateField('overflow', val)"
      >
        <a-select-option value="show">Show</a-select-option>
        <a-select-option value="hidden">Hidden</a-select-option>
      </a-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { PlusOutlined, CloseOutlined, LinkOutlined } from '@ant-design/icons-vue'
import type { TrackDefinition, LayoutConfig } from '@/core/types/document'

const props = defineProps<{
  value: Record<string, any> | undefined
}>()

const emit = defineEmits<{
  (e: 'update', value: Record<string, any>): void
}>()

const paddingLinked = ref(true)

const layout = computed<LayoutConfig>(() => {
  const val = props.value || {}
  return {
    type: 'grid' as const,
    columns: val.columns ?? [{ value: 1, unit: 'fr' }],
    rows: val.rows ?? [{ value: 1, unit: 'fr' }],
    colGap: val.colGap ?? 0,
    rowGap: val.rowGap ?? 0,
    padding: val.padding ?? { top: 0, right: 0, bottom: 0, left: 0 },
    overflow: val.overflow ?? 'show',
  }
})

const columns = computed<TrackDefinition[]>(() => layout.value.columns ?? [{ value: 1, unit: 'fr' }])
const rows = computed<TrackDefinition[]>(() => layout.value.rows ?? [{ value: 1, unit: 'fr' }])

const paddingH = computed(() => layout.value.padding?.left ?? 0)
const paddingV = computed(() => layout.value.padding?.top ?? 0)

const presetLabel = computed(() => {
  const c = columns.value.length
  const r = rows.value.length
  const key = `${c}x${r}`
  const presets = ['1x1', '1x2', '2x1', '2x2', '3x1', '3x2', '3x3', '4x1']
  return presets.includes(key) ? key : 'custom'
})

function emitUpdate(partial: Partial<LayoutConfig>) {
  const merged = { ...layout.value, ...partial }
  emit('update', merged)
}

function applyPreset(preset: string) {
  if (preset === 'custom') return
  const [colStr, rowStr] = preset.split('x')
  const c = parseInt(colStr, 10)
  const r = parseInt(rowStr, 10)
  const newCols: TrackDefinition[] = Array.from({ length: c }, () => ({ value: 1, unit: 'fr' as const }))
  const newRows: TrackDefinition[] = Array.from({ length: r }, () => ({ value: 1, unit: 'fr' as const }))
  emitUpdate({ columns: newCols, rows: newRows })
}

function addColumn() {
  const newCols = [...columns.value, { value: 1, unit: 'fr' as const }]
  emitUpdate({ columns: newCols })
}

function addRow() {
  const newRows = [...rows.value, { value: 1, unit: 'fr' as const }]
  emitUpdate({ rows: newRows })
}

function removeTrack(axis: 'columns' | 'rows', index: number) {
  const tracks = axis === 'columns' ? [...columns.value] : [...rows.value]
  if (tracks.length <= 1) return
  tracks.splice(index, 1)
  emitUpdate({ [axis]: tracks })
}

function updateTrack(axis: 'columns' | 'rows', index: number, field: 'value' | 'unit', val: any) {
  const tracks = axis === 'columns' ? [...columns.value] : [...rows.value]
  if (val === null || val === undefined) return
  tracks[index] = { ...tracks[index], [field]: val }
  emitUpdate({ [axis]: tracks })
}

function updateField(key: string, val: any) {
  emitUpdate({ [key]: val })
}

function updatePadding(direction: 'h' | 'v', val: number) {
  const p = { ...(layout.value.padding ?? { top: 0, right: 0, bottom: 0, left: 0 }) }
  if (paddingLinked.value) {
    p.top = val
    p.right = val
    p.bottom = val
    p.left = val
  } else if (direction === 'h') {
    p.left = val
    p.right = val
  } else {
    p.top = val
    p.bottom = val
  }
  emitUpdate({ padding: p })
}
</script>

<style scoped>
.layout-control {
  display: flex;
  flex-direction: column;
  gap: 0;
  font-size: 12px;
  color: #333;
}

.layout-section {
  padding: 10px 0;
  border-bottom: 1px solid #e8e8e8;
}

.layout-section:last-child {
  border-bottom: none;
}

.section-label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.unit-badge {
  font-size: 11px;
  color: #1677ff;
  cursor: pointer;
}

.preset-icon {
  font-size: 14px;
  margin-right: 6px;
}

/* Track list (columns/rows) */
.track-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.track-index {
  width: 14px;
  font-size: 11px;
  color: #999;
  text-align: center;
  flex-shrink: 0;
}

.track-value {
  flex: 1;
  min-width: 0;
}

.track-unit {
  width: 56px;
  flex-shrink: 0;
}

.track-delete {
  flex-shrink: 0;
  opacity: 0.4;
}

.track-delete:hover {
  opacity: 1;
}

/* Gaps & Padding */
.gap-row {
  display: flex;
  gap: 8px;
}

.gap-input {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.gap-icon {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.gap-value {
  flex: 1;
  min-width: 0;
}

.gap-unit {
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
}

.link-active {
  color: #1677ff !important;
}

/* Override ant-design sizes for compact look */
:deep(.ant-input-number) {
  font-size: 12px;
}

:deep(.ant-select) {
  font-size: 12px;
}

:deep(.ant-input-number-input) {
  padding: 0 4px;
  height: 24px;
}

:deep(.ant-select-selector) {
  height: 24px !important;
  padding: 0 6px !important;
}

:deep(.ant-select-selection-item) {
  line-height: 22px !important;
  font-size: 12px;
}

:deep(.ant-btn-sm) {
  height: 22px;
  width: 22px;
  padding: 0;
}
</style>
