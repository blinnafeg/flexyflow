<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Layout, GridSlot } from '@/types'
import { supabase } from '@/lib/supabase'
import WidgetRenderer from '@/components/widgets/WidgetRenderer.vue'

const route  = useRoute()
const router = useRouter()
const pageId = route.params.id as string

const loading = ref(true)
const error   = ref<string | null>(null)
const layout  = ref<Layout | null>(null)

// slotName → widgetId
const slotWidgetIds = ref<Record<string, string>>({})

const gridStyle = computed(() => {
  const cfg = layout.value?.config
  if (!cfg) return {}
  return {
    display: 'grid',
    gridTemplateColumns: cfg.colWidths?.join(' ') || '1fr',
    gridTemplateRows:    cfg.rowHeights?.join(' ') || 'auto',
    gap:        cfg.gap || '0px',
    minHeight: '100vh',
  }
})

function slotStyle(slot: GridSlot): Record<string, string> {
  return {
    gridColumn: `${slot.col} / ${slot.col + slot.colSpan}`,
    gridRow:    `${slot.row} / ${slot.row + slot.rowSpan}`,
  }
}

onMounted(async () => {
  try {
    // Load page
    const { data: pageData, error: pe } = await supabase
      .from('ff_pages')
      .select('*')
      .eq('id', pageId)
      .single()
    if (pe) throw pe

    // Load layout
    if (pageData.layout_id) {
      const { data: layoutData, error: le } = await supabase
        .from('ff_layouts')
        .select('*')
        .eq('id', pageData.layout_id)
        .single()
      if (le) throw le
      layout.value = {
        id:        layoutData.id,
        projectId: layoutData.project_id,
        name:      layoutData.name,
        config:    layoutData.config,
        slots:     layoutData.slots ?? [],
        createdAt: layoutData.created_at,
        updatedAt: layoutData.updated_at,
      }
    }

    // Map slotName → widgetId
    const content = (pageData.content ?? {}) as Record<string, { widgetId: string; order: number }[]>
    const result: Record<string, string> = {}
    for (const [slotName, assignments] of Object.entries(content)) {
      const wid = assignments[0]?.widgetId
      if (wid) result[slotName] = wid
    }
    slotWidgetIds.value = result

  } catch (e: unknown) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-white">

    <!-- Floating back button -->
    <button
      class="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-2 rounded-full shadow-lg backdrop-blur-sm transition-colors"
      title="Вернуться в FlexyFlow"
      @click="router.push(`/pages/${pageId}/edit`)"
    >
      <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      FlexyFlow
    </button>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen text-gray-400">
      <svg class="animate-spin size-6 mr-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Загрузка...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen text-red-500">
      {{ error }}
    </div>

    <!-- No layout -->
    <div v-else-if="!layout" class="flex items-center justify-center min-h-screen text-gray-400">
      Страница не настроена
    </div>

    <!-- Page render -->
    <div v-else :style="gridStyle">
      <div
        v-for="slot in layout.slots"
        :key="slot.id"
        :style="slotStyle(slot)"
      >
        <WidgetRenderer
          v-if="slotWidgetIds[slot.name]"
          :widget-id="slotWidgetIds[slot.name]"
        />
      </div>
    </div>

  </div>
</template>
