<template>
  <a-layout class="h-screen w-screen">
    <!-- Top Bar -->
    <a-layout-header class="flex items-center justify-between px-4 h-12 leading-none bg-white border-b border-gray-200 shadow-sm">
      <TopBar />
    </a-layout-header>

    <a-layout class="flex-1 overflow-hidden">
      <!-- Left Panel (Sidebar) -->
      <a-layout-sider
        width="60"
        theme="light"
        class="bg-white border-r border-gray-200 z-50 relative"
      >
        <LeftPanel />
      </a-layout-sider>

      <!-- Drawers (Absolute positioning next to sidebar) -->
      <div v-if="uiStore.activeSidebarTab" class="absolute left-[60px] top-0 bottom-0 z-40 shadow-xl flex">
        <!-- Add Elements Drawer -->
        <ComponentDrawer 
          v-if="uiStore.activeSidebarTab === 'add'" 
          class="w-[300px] h-full"
        />
        
        <!-- Layers Drawer -->
        <LayersDrawer 
          v-if="uiStore.activeSidebarTab === 'layers'" 
          @close="uiStore.setSidebarTab(null)"
        />
      </div>

      <!-- Canvas -->
      <a-layout-content class="relative overflow-auto bg-gray-50/50">
        <Canvas />
      </a-layout-content>

      <!-- Right Panel -->
      <a-layout-sider
        :width="280"
        theme="light"
        class="bg-white border-l border-gray-200 overflow-y-auto"
      >
        <RightPanel />
      </a-layout-sider>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import TopBar from '@/editor/TopBar.vue'
import LeftPanel from '@/editor/LeftPanel.vue'
import Canvas from '@/editor/Canvas.vue'
import RightPanel from '@/editor/RightPanel.vue'
import ComponentDrawer from '@/editor/drawers/ComponentDrawer.vue'
import LayersDrawer from '@/editor/drawers/LayersDrawer.vue'
import { useUiStore } from '@/core/store/ui.store'
const props = defineProps<{
  siteId?: string
}>()

const uiStore = useUiStore()
</script>
