<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Layout, GridSlot } from '@/types'
import { supabase } from '@/lib/supabase'
import { useProjectsStore } from '@/stores/projects.store'
import GridBuilder from '@/components/layout/GridBuilder.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, ArrowLeft, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()

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
  name.value = layout.name
  gridCols.value = layout.config.gridCols ?? 3
  gridRows.value = layout.config.gridRows ?? 3
  colWidths.value = layout.config.colWidths?.length ? layout.config.colWidths : Array(gridCols.value).fill('1fr')
  rowHeights.value = layout.config.rowHeights?.length ? layout.config.rowHeights : Array(gridRows.value).fill('auto')
  gap.value = layout.config.gap ?? '0px'
  slots.value = layout.slots ?? []
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
      <Button :disabled="saving" @click="save">
        <Loader2 v-if="saving" class="size-4 mr-1 animate-spin" />
        <Save v-else class="size-4 mr-1" />
        Сохранить
      </Button>
    </div>

    <!-- Grid builder -->
    <div class="flex-1 overflow-auto p-4">
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
</template>
