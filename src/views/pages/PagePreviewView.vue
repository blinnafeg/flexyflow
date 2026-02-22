<script setup lang="ts">
import { ref, computed, onMounted, shallowRef, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Layout, GridSlot } from '@/types'
import { supabase } from '@/lib/supabase'
import { DataSourceService } from '@/services/DataSourceService'
import WidgetRenderer from '@/components/widgets/WidgetRenderer.vue'
import { useBreakpointsStore } from '@/stores/breakpoints.store'
import { useBreakpointMatch } from '@/composables/useBreakpointMatch'
import type { BreakpointId } from '@/types/breakpoints'

const route  = useRoute()
const router = useRouter()
const pageId = route.params.id as string

const bpStore = useBreakpointsStore()
const { currentId: bpDetected } = useBreakpointMatch()

/** Manually pinned breakpoint (null = auto-detect from window width) */
const bpPinned = ref<BreakpointId | null>(null)

const bpCurrentId = computed<BreakpointId>(() => bpPinned.value ?? bpDetected.value)

const loading = ref(true)
const error   = ref<string | null>(null)

// slotName → sorted widget entries
const slotWidgets = ref<Record<string, { widgetId: string; order: number }[]>>({})
// slotName → orientation / backgroundColor
const slotSettings = ref<Record<string, { orientation: 'row' | 'column'; backgroundColor?: string }>>({})

// Per-project data service — provided to all nested WidgetRenderer / PreviewNode
const pageDataService = shallowRef<DataSourceService>(new DataSourceService())
provide('dataService', pageDataService)

/**
 * All layouts loaded for the page keyed by BreakpointId.
 * A breakpoint that has no explicit layout assigned will be null.
 */
const allLayouts = ref<Partial<Record<BreakpointId, Layout | null>>>({})

/**
 * Picks the right layout for the current viewport breakpoint.
 * Fallback chain: mobile → tablet → tabletLandscape → desktop
 */
const layout = computed((): Layout | null => {
  const bp = bpCurrentId.value
  const l = allLayouts.value
  if (bp === 'mobile')          return l.mobile          ?? l.tablet ?? l.tabletLandscape ?? l.desktop ?? null
  if (bp === 'tablet')          return l.tablet          ?? l.tabletLandscape ?? l.desktop ?? null
  if (bp === 'tabletLandscape') return l.tabletLandscape ?? l.desktop ?? null
  return l.desktop ?? null
})

const gridStyle = computed(() => {
  const cfg = layout.value?.config
  if (!cfg) return { display: 'block' }
  return {
    display: 'grid',
    gridTemplateColumns: cfg.colWidths.join(' ') || '1fr',
    gridTemplateRows:    cfg.rowHeights.join(' ') || 'auto',
    gap:       cfg.gap || '0px',
    minHeight: '100vh',
  }
})

function slotStyle(slot: GridSlot): Record<string, string> {
  return {
    gridColumn: `${slot.col} / ${slot.col + slot.colSpan}`,
    gridRow:    `${slot.row} / ${slot.row + slot.rowSpan}`,
  }
}

function slotFlexStyle(slotName: string): Record<string, string> {
  const orientation = slotSettings.value[slotName]?.orientation ?? 'column'
  return {
    display: 'flex',
    flexDirection: orientation,
  }
}

async function loadLayoutById(layoutId: string): Promise<Layout | null> {
  const { data, error: e } = await supabase
    .from('ff_layouts')
    .select('*')
    .eq('id', layoutId)
    .single()
  if (e || !data) return null
  return {
    id:        data.id,
    projectId: data.project_id,
    name:      data.name,
    config:    data.config,
    slots:     data.slots ?? [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
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

    // Load breakpoints for viewport detection
    bpStore.load(pageData.project_id)

    // Load project credentials for per-project data service
    if (pageData.project_id) {
      const { data: projData } = await supabase
        .from('ff_projects')
        .select('supabase_url, supabase_anon_key')
        .eq('id', pageData.project_id)
        .single()
      if (projData?.supabase_url && projData?.supabase_anon_key) {
        pageDataService.value = new DataSourceService({
          url: projData.supabase_url as string,
          anonKey: projData.supabase_anon_key as string,
        })
      }
    }

    // Collect all unique layout IDs from responsive_layouts + layout_id
    const responsiveLayouts = (pageData.responsive_layouts ?? {}) as Partial<Record<BreakpointId, string>>
    const baseLayoutId = pageData.layout_id as string | null

    const layoutIdSet = new Set<string>()
    if (baseLayoutId) layoutIdSet.add(baseLayoutId)
    for (const id of Object.values(responsiveLayouts)) {
      if (id) layoutIdSet.add(id)
    }

    // Load all referenced layouts in parallel
    const layoutMap = new Map<string, Layout>()
    await Promise.all([...layoutIdSet].map(async (id) => {
      const l = await loadLayoutById(id)
      if (l) layoutMap.set(id, l)
    }))

    // Build per-breakpoint layout map
    const bpIds: BreakpointId[] = ['desktop', 'tabletLandscape', 'tablet', 'mobile']
    for (const bp of bpIds) {
      const id = (responsiveLayouts as Record<string, string>)[bp]
               ?? (bp === 'desktop' ? baseLayoutId : null)
      allLayouts.value[bp] = id ? (layoutMap.get(id) ?? null) : null
    }

    // Parse content: separate _settings from widget assignments
    const rawContent = (pageData.content ?? {}) as Record<string, unknown>
    slotSettings.value = (rawContent['_settings'] ?? {}) as Record<string, { orientation: 'row' | 'column' }>

    const widgets: Record<string, { widgetId: string; order: number }[]> = {}
    for (const [key, value] of Object.entries(rawContent)) {
      if (key !== '_settings' && Array.isArray(value) && value.length > 0) {
        widgets[key] = (value as { widgetId: string; order: number }[])
          .slice()
          .sort((a, b) => a.order - b.order)
      }
    }
    slotWidgets.value = widgets

  } catch (e: unknown) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-white">

    <!-- Floating toolbar -->
    <div class="fixed bottom-5 right-5 z-50 flex items-center gap-2">
      <!-- Breakpoint switcher -->
      <div class="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1.5">
        <!-- auto (follows window width) -->
        <button
          :class="[
            'px-2 py-0.5 rounded-full text-xs transition-colors',
            bpPinned === null ? 'bg-white text-black font-medium' : 'text-white/70 hover:text-white',
          ]"
          title="Авто (по ширине окна)"
          @click="bpPinned = null"
        >Auto</button>
        <button
          v-for="bp in bpStore.breakpoints"
          :key="bp.id"
          :class="[
            'px-2 py-0.5 rounded-full text-xs transition-colors',
            bpPinned === bp.id ? 'bg-white text-black font-medium' : 'text-white/70 hover:text-white',
          ]"
          :title="bp.label"
          @click="bpPinned = bp.id"
        >{{ bp.label }}</button>
      </div>

      <!-- Back button -->
      <button
        class="flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-2 rounded-full shadow-lg backdrop-blur-sm transition-colors"
        title="Вернуться в FlexyFlow"
        @click="router.push(`/pages/${pageId}/edit`)"
      >
        <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        FlexyFlow
      </button>
    </div>

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

    <!-- No layout for current breakpoint -->
    <div v-else-if="!layout" class="flex items-center justify-center min-h-screen text-gray-400">
      Страница не настроена
    </div>

    <!-- Page render -->
    <div v-else :style="gridStyle">
      <div
        v-for="slot in (layout.slots ?? [])"
        :key="slot.id"
        :style="{
          ...slotStyle(slot),
          ...slotFlexStyle(slot.name),
          backgroundColor: slotSettings[slot.name]?.backgroundColor || undefined,
        }"
      >
        <WidgetRenderer
          v-for="entry in (slotWidgets[slot.name] ?? [])"
          :key="entry.widgetId"
          :widget-id="entry.widgetId"
        />
      </div>
    </div>

  </div>
</template>
