<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { Toaster } from '@/components/ui/sonner'
import { useTheme } from '@/composables/useTheme'

// Initialize theme (applies .dark class to <html> based on saved preference)
useTheme()

const route = useRoute()
// Routes that render without the admin shell (sidebar etc.)
const isStandalone = computed(() => route.name === 'page-preview')
</script>

<template>
  <!-- Standalone view (no shell) -->
  <template v-if="isStandalone">
    <RouterView />
    <Toaster rich-colors position="top-right" />
  </template>

  <!-- Admin shell -->
  <template v-else>
    <div class="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>
    <Toaster rich-colors position="top-right" />
  </template>
</template>
