<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { LayoutGrid, FolderOpen, Sun, Moon, Zap } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const { isDark, toggleTheme } = useTheme()

const navItems = [
  { to: '/', label: 'Дашборд', icon: LayoutGrid },
  { to: '/projects', label: 'Проекты', icon: FolderOpen },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <aside class="w-56 border-r border-border bg-card flex flex-col h-full shrink-0">
    <!-- Logo -->
    <div class="flex items-center gap-2 px-4 py-4 border-b border-border">
      <Zap class="size-5 text-primary" />
      <span class="font-bold text-lg tracking-tight">FlexyFlow</span>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-2 py-3 space-y-0.5">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
        :class="isActive(item.to)
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
      >
        <component :is="item.icon" class="size-4 shrink-0" />
        {{ item.label }}
      </RouterLink>
    </nav>

    <!-- Footer -->
    <div class="px-3 py-3 border-t border-border flex items-center justify-between">
      <p class="text-xs text-muted-foreground">FlexyFlow v0.1</p>
      <button
        class="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        :title="isDark ? 'Светлая тема' : 'Тёмная тема'"
        @click="toggleTheme"
      >
        <Sun v-if="isDark" class="size-4" />
        <Moon v-else class="size-4" />
      </button>
    </div>
  </aside>
</template>
