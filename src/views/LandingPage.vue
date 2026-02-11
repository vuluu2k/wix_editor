<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
    <div class="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-6 font-display">Wix Clone</h1>
      <p class="text-gray-600 mb-8 text-lg">Build your dream website with our powerful drag & drop editor.</p>
      
      <div class="space-y-4">
        <router-link 
          to="/dashboard" 
          class="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg transform active:scale-95"
        >
          Get Started
        </router-link>
        <button class="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors">
          Learn More
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Landing Page
</script>
