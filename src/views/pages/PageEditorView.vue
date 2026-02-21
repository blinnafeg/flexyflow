<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Page, Layout, GridSlot } from '@/types'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Globe, Loader2, Settings, X, LayoutGrid, Puzzle, ExternalLink, Eye, Zap, Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()

const pageId = route.params.id as string
const saving = ref(false)
const loading = ref(true)
const settingsOpen = ref(false)

const page = ref<Page | null>(null)
const layout = ref<Layout | null>(null)
const availableLayouts = ref<Layout[]>([])
const availableWidgets = ref<{ id: string; name: string }[]>([])
const selectedSlot = ref<GridSlot | null>(null)

interface SlotWorkflow { id: string; name: string; trigger: string; steps: unknown[] }
const slotWorkflows = ref<SlotWorkflow[]>([])
const loadingSlotWorkflows = ref(false)

// Grid styles
const gridStyle = computed(() => {
  const cfg = layout.value?.config
  if (!cfg) return { display: 'block' }
  return {
    display: 'grid',
    gridTemplateColumns: cfg.colWidths?.join(' ') || '1fr',
    gridTemplateRows: cfg.rowHeights?.join(' ') || 'auto',
    gap: cfg.gap || '0px',
    minHeight: '100%',
  }
})

function slotStyle(slot: GridSlot): Record<string, string> {
  return {
    gridColumn: `${slot.col} / ${slot.col + slot.colSpan}`,
    gridRow: `${slot.row} / ${slot.row + slot.rowSpan}`,
  }
}

function getSlotWidgetId(slotName: string): string | null {
  const items = page.value?.content[slotName]
  return items?.[0]?.widgetId ?? null
}

function getSlotWidgetName(slotName: string): string | null {
  const wid = getSlotWidgetId(slotName)
  if (!wid) return null
  return availableWidgets.value.find(w => w.id === wid)?.name ?? null
}

async function loadSlotWorkflows(widgetId: string) {
  loadingSlotWorkflows.value = true
  slotWorkflows.value = []
  const { data } = await supabase
    .from('ff_workflows')
    .select('id, name, trigger, steps')
    .eq('widget_id', widgetId)
    .order('created_at', { ascending: false })
  slotWorkflows.value = data ?? []
  loadingSlotWorkflows.value = false
}

async function createSlotWorkflow(widgetId: string) {
  if (!page.value) return
  const { data, error } = await supabase
    .from('ff_workflows')
    .insert({
      project_id: page.value.projectId,
      name: 'Новый воркфлоу',
      trigger: 'onClick',
      steps: [],
      widget_id: widgetId,
      page_id: pageId,
    })
    .select()
    .single()
  if (error) { toast.error(error.message); return }
  router.push(`/workflows/${data.id}`)
}

function selectSlot(slot: GridSlot) {
  selectedSlot.value = slot
  settingsOpen.value = false
  const wid = getSlotWidgetId(slot.name)
  if (wid) loadSlotWorkflows(wid)
  else slotWorkflows.value = []
}

function openSettings() {
  settingsOpen.value = true
  selectedSlot.value = null
}

async function loadLayout(layoutId: string) {
  const { data, error } = await supabase
    .from('ff_layouts')
    .select('*')
    .eq('id', layoutId)
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    projectId: data.project_id,
    name: data.name,
    config: data.config,
    slots: data.slots ?? [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as Layout
}

onMounted(async () => {
  try {
    const { data: pageData, error: pe } = await supabase
      .from('ff_pages')
      .select('*')
      .eq('id', pageId)
      .single()
    if (pe) throw pe

    page.value = {
      id: pageData.id,
      projectId: pageData.project_id,
      name: pageData.name,
      slug: pageData.slug,
      layoutId: pageData.layout_id,
      content: pageData.content ?? {},
      isPublished: pageData.is_published ?? false,
      createdAt: pageData.created_at,
      updatedAt: pageData.updated_at,
    }

    if (pageData.layout_id) {
      layout.value = await loadLayout(pageData.layout_id)
    }

    const [layoutsRes, widgetsRes] = await Promise.all([
      supabase
        .from('ff_layouts')
        .select('*')
        .eq('project_id', pageData.project_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('ff_widgets')
        .select('id, name')
        .eq('project_id', pageData.project_id)
        .order('created_at', { ascending: false }),
    ])

    availableLayouts.value = (layoutsRes.data ?? []).map((l: Record<string, unknown>) => ({
      id: l.id as string,
      projectId: l.project_id as string,
      name: l.name as string,
      config: l.config as Layout['config'],
      slots: (l.slots as Layout['slots']) ?? [],
      createdAt: l.created_at as string,
      updatedAt: l.updated_at as string,
    }))

    availableWidgets.value = (widgetsRes.data ?? []).map((w: Record<string, unknown>) => ({
      id: w.id as string,
      name: w.name as string,
    }))
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    loading.value = false
  }
})

// Assign layout to page
async function assignLayout(layoutId: string | null) {
  if (!page.value) return
  try {
    const { error } = await supabase
      .from('ff_pages')
      .update({ layout_id: layoutId })
      .eq('id', pageId)
    if (error) throw error

    page.value.layoutId = layoutId ?? undefined
    layout.value = layoutId ? (await loadLayout(layoutId)) : null
    selectedSlot.value = null
    toast.success(layoutId ? 'Макет назначен' : 'Макет снят')
  } catch (e: unknown) {
    toast.error((e as Error).message)
  }
}

// Assign widget to slot
async function assignWidget(slotName: string, widgetId: string | null) {
  if (!page.value) return
  const content = { ...page.value.content }
  if (widgetId) {
    content[slotName] = [{ widgetId, order: 0 }]
  } else {
    delete content[slotName]
  }
  page.value.content = content
  const { error } = await supabase
    .from('ff_pages')
    .update({ content })
    .eq('id', pageId)
  if (error) toast.error(error.message)
  else toast.success(widgetId ? 'Виджет назначен' : 'Виджет снят')
}

// Toggle published
async function togglePublished() {
  if (!page.value) return
  const next = !page.value.isPublished
  try {
    const { error } = await supabase
      .from('ff_pages')
      .update({ is_published: next })
      .eq('id', pageId)
    if (error) throw error
    page.value.isPublished = next
    toast.success(next ? 'Страница опубликована' : 'Публикация снята')
  } catch (e: unknown) {
    toast.error((e as Error).message)
  }
}

function openPreview() {
  window.open(`/pages/${pageId}/preview`, '_blank')
}

async function save() {
  if (!page.value) return
  saving.value = true
  try {
    const { error } = await supabase
      .from('ff_pages')
      .update({
        name: page.value.name,
        slug: page.value.slug,
        content: page.value.content,
        is_published: page.value.isPublished,
      })
      .eq('id', pageId)
    if (error) throw error
    toast.success('Страница сохранена')
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Main column -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Toolbar -->
      <div class="flex items-center gap-3 px-4 py-2.5 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon-sm" @click="router.back()">
          <ArrowLeft class="size-4" />
        </Button>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ page?.name ?? '...' }}</p>
          <p class="text-xs text-muted-foreground">/{{ page?.slug }}</p>
        </div>
        <Badge v-if="page?.isPublished" variant="secondary" class="shrink-0">
          <Globe class="size-3 mr-1" />
          Опубликована
        </Badge>
        <Button
          variant="outline"
          size="icon-sm"
          class="shrink-0"
          title="Превью страницы"
          @click="openPreview"
        >
          <Eye class="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          class="shrink-0"
          :class="settingsOpen ? 'bg-accent' : ''"
          title="Настройки страницы"
          @click="openSettings"
        >
          <Settings class="size-4" />
        </Button>
        <Button :disabled="saving" class="shrink-0" @click="save">
          <Loader2 v-if="saving" class="size-4 mr-1 animate-spin" />
          <Save v-else class="size-4 mr-1" />
          Сохранить
        </Button>
      </div>

      <!-- Canvas -->
      <div class="flex-1 overflow-auto bg-muted/20">
        <div v-if="loading" class="flex items-center justify-center h-full text-muted-foreground">
          Загрузка...
        </div>

        <div v-else-if="!page" class="flex items-center justify-center h-full">
          <p class="text-muted-foreground">Страница не найдена</p>
        </div>

        <div v-else-if="layout" class="h-full" :style="gridStyle">
          <div
            v-for="slot in layout.slots"
            :key="slot.id"
            class="border border-dashed min-h-[80px] relative cursor-pointer transition-colors"
            :class="selectedSlot?.id === slot.id
              ? 'border-primary/70 bg-primary/5'
              : 'border-border/60 hover:border-border hover:bg-accent/20'"
            :style="slotStyle(slot)"
            @click="selectSlot(slot)"
          >
            <!-- Has widget assigned -->
            <div v-if="getSlotWidgetName(slot.name)" class="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              <div class="flex items-center gap-1.5 text-sm font-medium">
                <Puzzle class="size-4 text-purple-500" />
                {{ getSlotWidgetName(slot.name) }}
              </div>
              <Badge variant="outline" class="text-xs opacity-60">{{ slot.label || slot.name }}</Badge>
            </div>

            <!-- Empty slot -->
            <div v-else class="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <Badge variant="outline" class="text-xs">{{ slot.label || slot.name }}</Badge>
              <p class="text-xs text-muted-foreground">Нажмите, чтобы назначить виджет</p>
            </div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-full">
          <div class="text-center text-muted-foreground">
            <LayoutGrid class="size-10 mx-auto mb-3 opacity-30" />
            <p class="mb-1">Макет не назначен</p>
            <p class="text-xs">Откройте настройки страницы (⚙) и выберите макет</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Slot panel -->
    <div
      v-if="selectedSlot && page"
      class="w-72 border-l bg-card flex flex-col shrink-0"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <p class="font-semibold text-sm">{{ selectedSlot.label || selectedSlot.name }}</p>
          <p class="text-xs text-muted-foreground">Слот: {{ selectedSlot.name }}</p>
        </div>
        <Button variant="ghost" size="icon-sm" @click="selectedSlot = null">
          <X class="size-4" />
        </Button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Current widget -->
        <div class="space-y-2">
          <Label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Виджет</Label>

          <div v-if="availableWidgets.length === 0" class="text-xs text-muted-foreground py-1">
            Нет виджетов в проекте.
            <button
              class="text-primary underline"
              @click="router.push(`/projects/${page.projectId}/widgets`)"
            >Создать виджет</button>
          </div>

          <template v-else>
            <Select
              :model-value="getSlotWidgetId(selectedSlot.name) ?? '__none__'"
              @update:model-value="assignWidget(selectedSlot!.name, $event === '__none__' ? null : $event)"
            >
              <SelectTrigger class="h-8 text-sm">
                <SelectValue placeholder="Выберите виджет..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Без виджета —</SelectItem>
                <SelectItem
                  v-for="w in availableWidgets"
                  :key="w.id"
                  :value="w.id"
                >
                  <div class="flex items-center gap-1.5">
                    <Puzzle class="size-3.5 text-purple-500" />
                    {{ w.name }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Link to edit current widget -->
            <div v-if="getSlotWidgetId(selectedSlot.name)" class="pt-1">
              <Button
                variant="outline"
                size="sm"
                class="w-full text-xs"
                @click="router.push(`/widgets/${getSlotWidgetId(selectedSlot!.name)}/edit`)"
              >
                <ExternalLink class="size-3.5 mr-1" />
                Открыть в редакторе
              </Button>
            </div>
          </template>
        </div>

        <Separator />

        <!-- Workflows for slot's widget -->
        <div v-if="getSlotWidgetId(selectedSlot.name)" class="space-y-2">
          <div class="flex items-center justify-between">
            <Label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Zap class="size-3 inline mr-1" />Действия
            </Label>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Новый воркфлоу"
              @click="createSlotWorkflow(getSlotWidgetId(selectedSlot.name)!)"
            >
              <Plus class="size-3.5" />
            </Button>
          </div>

          <div v-if="loadingSlotWorkflows" class="text-xs text-muted-foreground py-1">
            Загрузка...
          </div>
          <div v-else-if="slotWorkflows.length === 0" class="text-xs text-muted-foreground py-1">
            Нет воркфлоу для этого виджета.
            <button
              class="text-primary underline ml-0.5"
              @click="createSlotWorkflow(getSlotWidgetId(selectedSlot.name)!)"
            >Создать</button>
          </div>
          <div v-else class="space-y-1">
            <button
              v-for="wf in slotWorkflows"
              :key="wf.id"
              class="w-full flex items-center gap-2 px-2.5 py-2 rounded-md border hover:bg-accent text-left transition-colors"
              @click="router.push(`/workflows/${wf.id}`)"
            >
              <Zap class="size-3.5 text-blue-500 shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium truncate">{{ wf.name }}</p>
                <p class="text-[10px] text-muted-foreground font-mono">{{ wf.trigger }} · {{ wf.steps.length }} шаг.</p>
              </div>
              <ExternalLink class="size-3 text-muted-foreground shrink-0" />
            </button>
          </div>
        </div>

        <Separator />

        <div class="text-xs text-muted-foreground space-y-1">
          <p>Позиция: строка {{ selectedSlot.row }}, колонка {{ selectedSlot.col }}</p>
          <p>Размер: {{ selectedSlot.colSpan }} кол. × {{ selectedSlot.rowSpan }} стр.</p>
        </div>
      </div>
    </div>

    <!-- Settings panel -->
    <div
      v-if="settingsOpen && page"
      class="w-72 border-l bg-card flex flex-col shrink-0"
    >
      <!-- Panel header -->
      <div class="flex items-center justify-between px-4 py-3 border-b">
        <p class="font-semibold text-sm">Настройки страницы</p>
        <Button variant="ghost" size="icon-sm" @click="settingsOpen = false">
          <X class="size-4" />
        </Button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-5">
        <!-- Name -->
        <div class="space-y-1.5">
          <Label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</Label>
          <Input
            :model-value="page.name"
            class="h-8 text-sm"
            @update:model-value="page.name = $event"
          />
        </div>

        <!-- Slug -->
        <div class="space-y-1.5">
          <Label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL slug</Label>
          <div class="flex items-center gap-1">
            <span class="text-xs text-muted-foreground">/</span>
            <Input
              :model-value="page.slug"
              class="h-8 text-sm"
              placeholder="my-page"
              @update:model-value="page.slug = $event"
            />
          </div>
        </div>

        <Separator />

        <!-- Layout selector -->
        <div class="space-y-2">
          <Label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Макет</Label>

          <div v-if="availableLayouts.length === 0" class="text-xs text-muted-foreground py-2">
            Нет макетов в проекте.
            <button
              class="text-primary underline"
              @click="router.push(`/projects/${page.projectId}/layouts`)"
            >Создать макет</button>
          </div>

          <template v-else>
            <Select
              :model-value="page?.layoutId ?? '__none__'"
              @update:model-value="assignLayout($event === '__none__' ? null : $event)"
            >
              <SelectTrigger class="h-8 text-sm">
                <SelectValue placeholder="Выберите макет..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Без макета —</SelectItem>
                <SelectItem
                  v-for="l in availableLayouts"
                  :key="l.id"
                  :value="l.id"
                >
                  {{ l.name }}
                  <span class="text-muted-foreground ml-1 text-xs">
                    {{ l.config.gridCols }}×{{ l.config.gridRows }}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Current layout info -->
            <div v-if="layout" class="rounded-md border p-2.5 bg-muted/30 space-y-1 text-xs text-muted-foreground">
              <p><span class="font-medium text-foreground">{{ layout.name }}</span></p>
              <p>{{ layout.config.gridCols }} колонок · {{ layout.config.gridRows }} строк · {{ layout.slots.length }} слотов</p>
              <button
                class="text-primary underline"
                @click="router.push(`/layouts/${layout!.id}/edit`)"
              >Редактировать макет ↗</button>
            </div>
          </template>
        </div>

        <Separator />

        <!-- Published toggle -->
        <div class="space-y-2">
          <Label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Публикация</Label>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm">{{ page?.isPublished ? 'Опубликована' : 'Черновик' }}</p>
              <p class="text-xs text-muted-foreground">{{ page?.isPublished ? 'Страница видна публично' : 'Страница скрыта' }}</p>
            </div>
            <Button
              :variant="page?.isPublished ? 'destructive' : 'default'"
              size="sm"
              @click="togglePublished"
            >
              {{ page?.isPublished ? 'Снять' : 'Опубликовать' }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
