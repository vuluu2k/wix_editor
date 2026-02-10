import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const activeSidebarTab = ref<string | null>(null)
  
  function setSidebarTab(tab: string | null) {
    if (activeSidebarTab.value === tab) {
      activeSidebarTab.value = null // toggle off
    } else {
      activeSidebarTab.value = tab
    }
  }

  return {
    activeSidebarTab,
    setSidebarTab
  }
})
