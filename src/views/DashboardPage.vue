<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <!-- Navbar -->
    <nav class="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">W</div>
        <span class="text-xl font-bold text-gray-800 tracking-tight">Wix Clone Dashboard</span>
      </div>
      <div class="flex items-center gap-4">
        <div class="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        </div>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto px-6 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">My Sites</h1>
          <p class="text-gray-500">Manage your websites and projects</p>
        </div>
        <button 
          @click="createNewSite"
          class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm font-medium flex items-center gap-2 transition-all hover:shadow-md"
        >
          <span class="text-xl leading-none">+</span> Create New Site
        </button>
      </div>

      <!-- Site Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Site Card -->
        <div 
          v-for="site in sites" 
          :key="site.id" 
          class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group hover:border-blue-300"
        >
          <!-- Preview -->
          <div class="h-48 bg-gray-100 relative group-hover:bg-gray-50 transition-colors flex items-center justify-center overflow-hidden">
             <!-- Mock Preview -->
             <div class="transform scale-75 opacity-50 group-hover:opacity-100 group-hover:scale-90 transition-all duration-500">
                <div class="w-64 h-40 bg-white shadow-sm border border-gray-200 rounded-md p-2">
                   <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                   <div class="space-y-1">
                      <div class="h-2 bg-gray-100 rounded w-full"></div>
                      <div class="h-2 bg-gray-100 rounded w-5/6"></div>
                      <div class="h-2 bg-gray-100 rounded w-4/6"></div>
                   </div>
                </div>
             </div>
             
             <!-- Overlay Actions -->
             <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity backdrop-blur-[1px]">
                <button 
                  @click="editSite(site.id)" 
                  class="bg-white text-blue-600 hover:text-blue-700 px-4 py-2 rounded-full font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                >
                  Edit Site
                </button>
             </div>
          </div>

          <!-- Info -->
          <div class="p-5">
            <h3 class="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{{ site.name }}</h3>
            <div class="flex justify-between items-center text-sm text-gray-500">
               <span>{{ site.url }}</span>
               <span class="text-xs bg-gray-100 px-2 py-1 rounded">Draft</span>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
               <span class="text-xs text-gray-400">Edited {{ site.lastEdited }}</span>
               <button class="text-gray-400 hover:text-red-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
               </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorStore } from '@/core/store/editor.store'

const router = useRouter()
const store = useEditorStore()

// Mock Data
const sites = ref([
  { id: 'site-1', name: 'My Portfolio', url: 'mysite.wixclone.com', lastEdited: '2 mins ago' },
  { id: 'site-2', name: 'E-commerce Shop', url: 'shop.wixclone.com', lastEdited: '2 days ago' },
  { id: 'site-3', name: 'Landing Page Concept', url: 'landing.wixclone.com', lastEdited: '1 week ago' },
])

function createNewSite() {
  const newId = `site-${Date.now()}`
  // In a real app, this would call API
  // For now, we just navigate to editor with new ID
  // Optionally reset store here
  router.push(`/editor/${newId}`)
}

function editSite(id: string) {
  router.push(`/editor/${id}`)
}
</script>
