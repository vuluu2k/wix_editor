<template>
  <div class="border-b border-gray-100 last:border-0">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-gray-50 transition-colors"
      @click="toggle"
    >
      <span class="text-xs font-bold text-gray-800 uppercase tracking-wider">{{ title }}</span>
      <component
        :is="isOpen ? DownOutlined : RightOutlined"
        class="text-[10px] text-gray-400"
      />
    </div>

    <!-- Content -->
    <div
      v-show="isOpen"
      class="px-4 pb-4 pt-0 transition-all duration-200"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { DownOutlined, RightOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  title: string
  defaultOpen?: boolean
}>()

const isOpen = ref(props.defaultOpen ?? true)

function toggle() {
  isOpen.value = !isOpen.value
}
</script>
