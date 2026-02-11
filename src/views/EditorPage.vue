<template>
  <EditorLayout :site-id="route.params.siteId" />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import EditorLayout from '@/editor/EditorLayout.vue'

const route = useRoute()
</script>
