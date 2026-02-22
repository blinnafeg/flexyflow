<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Layout, GridSlot } from '@/types'
import { supabase } from '@/lib/supabase'
import { useProjectsStore } from '@/stores/projects.store'
import { useBreakpointsStore } from '@/stores/breakpoints.store'
import GridBuilder from '@/components/layout/GridBuilder.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, ArrowLeft, Loader2, Smartphone, Tablet, Monitor } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { BreakpointId } from '@/types/breakpoints'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()
const bpStore = useBreakpointsStore()

const BP_ICONS: Record<BreakpointId, typeof Smartphone> = {
  mobile:          Smartphone,
  tablet:          Tablet,
  tabletLandscape: Tablet,
  desktop:         Monitor,
}

const layoutId = route.params.id as string
const saving = ref(false)

// Editable layout state
const name = ref('')
const gridCols = ref(3)
const gridRows = ref(3)
const colWidths = ref<string[]>(['1fr', '1fr', '1fr'])
const rowHeights = ref<string[]>(['auto', '1fr', 'auto'])
const gap = ref('0px')
const slots = ref<GridSlot[]>([])

onMounted(async () => {
  // Find layout from store or load it
  await store.loadProjects()
  // Find in already-loaded layouts
  let layout = store.layouts.find(l => l.id === layoutId)
  if (!layout) {
    const { data } = await supabase.from('ff_layouts').select('*').eq('id', layoutId).single()
    if (data) {
      layout = {
        id: data.id,
        projectId: data.project_id,
        name: data.name,
        config: data.config,
        slots: data.slots ?? [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    }
  }
  if (!layout) { toast.error('Макет не найден'); return }

  store.activeProjectId = layout.projectId
  bpStore.load(layout.projectId)
  name.value = layout.name
  gridCols.value = layout.config.gridCols ?? 3
  gridRows.value = layout.config.gridRows ?? 3
  colWidths.value = layout.config.colWidths?.length ? layout.config.colWidths : Array(gridCols.value).fill('1fr')
  rowHeights.value = layout.config.rowHeights?.length ? layout.config.rowHeights : Array(gridRows.value).fill('auto')
  gap.value = layout.config.gap ?? '0px'
  slots.value = layout.slots ?? []
})

onUnmounted(() => {
  bpStore.activeId = 'desktop'
})

async function save() {
  saving.value = true
  try {
    await store.updateLayout(layoutId, {
      name: name.value,
      config: { gridCols: gridCols.value, gridRows: gridRows.value, colWidths: colWidths.value, rowHeights: rowHeights.value, gap: gap.value },
      slots: slots.value,
    })
    toast.success('Макет сохранён')
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Toolbar -->
    <div class="flex items-center gap-3 px-4 py-2.5 border-b bg-card shrink-0">
      <Button variant="ghost" size="icon-sm" @click="router.back()">
        <ArrowLeft class="size-4" />
      </Button>
      <Input v-model="name" class="h-8 w-52 text-sm font-medium" />
      <span class="text-muted-foreground text-xs flex-1">Редактор макета</span>

      <!-- Breakpoint switcher -->
      <div class="flex items-center gap-0.5 border rounded-md p-0.5 shrink-0">
        <button
          v-for="bp in bpStore.breakpoints"
          :key="bp.id"
          :title="`${bp.label} (${bp.canvasWidth}px)`"
          class="h-6 w-6 flex items-center justify-center rounded transition-colors"
          :class="bpStore.activeId === bp.id
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
          @click="bpStore.activeId = bp.id"
        >
          <component :is="BP_ICONS[bp.id]" class="size-3.5" />
        </button>
      </div>
      <span class="text-xs text-muted-foreground font-mono shrink-0">
        {{ bpStore.active.canvasWidth }}px
      </span>

      <div class="w-px h-5 bg-border shrink-0" />

      <Button :disabled="saving" @click="save">
        <Loader2 v-if="saving" class="size-4 mr-1 animate-spin" />
        <Save v-else class="size-4 mr-1" />
        Сохранить
      </Button>
    </div>

    <!-- Grid builder -->
    <div class="flex-1 overflow-auto p-4 flex justify-center">
      <div :style="{ width: bpStore.active.canvasWidth + 'px', minWidth: '320px' }">
        <GridBuilder
          v-model:grid-cols="gridCols"
          v-model:grid-rows="gridRows"
          v-model:col-widths="colWidths"
          v-model:row-heights="rowHeights"
          v-model:gap="gap"
          v-model:slots="slots"
        />
      </div>
    </div>
  </div>
</template>
