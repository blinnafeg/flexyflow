<script setup lang="ts">
import { ref, computed, provide, reactive, watch, onMounted } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { canHaveChildren } from '@/composables/useWidgetTree'
import type { WidgetNode, WidgetType } from '@/types/widget-builder'
import { Input } from '@/components/ui/input'
import {
  Rows3, Columns3, Square, Type, MousePointerClick,
  FormInput, Pilcrow, List, Star, Blocks,
  ChevronsDownUp, ChevronsUpDown, Search, X,
} from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import TreeNode from './TreeNode.vue'

const store = useWidgetBuilderStore()

const isListItemWidget = computed(() => store.widgetKind === 'list-item')

// ── Collapse state ────────────────────────────────────────────────────────────
const collapsed = ref<Set<string>>(new Set())

function toggleCollapse(id: string) {
  if (collapsed.value.has(id)) collapsed.value.delete(id)
  else collapsed.value.add(id)
  // Trigger reactivity by replacing with new Set
  collapsed.value = new Set(collapsed.value)
}

function expandAll() {
  collapsed.value = new Set()
}

function collapseAll() {
  if (!store.widget) return
  const s = new Set<string>()
  function collect(n: WidgetNode) {
    if (n.children.length > 0) s.add(n.id)
    n.children.forEach(collect)
  }
  collect(store.widget.root)
  collapsed.value = s
}

// ── Drag state ────────────────────────────────────────────────────────────────
const dragState = reactive({
  draggedId:    null as string | null,
  dropTargetId: null as string | null,
  dropPosition: null as 'before' | 'after' | 'inside' | null,
})

// ── Search ────────────────────────────────────────────────────────────────────
const searchQuery = ref('')

// When search is cleared, restore collapse state naturally
watch(searchQuery, (q) => {
  if (!q) expandAll() // reveal everything after search exit
})

// ── Provide to all recursive TreeNode children ────────────────────────────────
provide('collapsed', collapsed)
provide('dragState', dragState)
provide('onToggle', toggleCollapse)
provide('searchQuery', searchQuery)

// ── Project widgets list (for WidgetRef) ──────────────────────────────────────
const projectWidgets = ref<{ id: string; name: string }[]>([])

onMounted(async () => {
  if (!store.widget?.projectId) return
  const { data } = await supabase
    .from('ff_widgets')
    .select('id, name')
    .eq('project_id', store.widget.projectId)
    .order('name')
  projectWidgets.value = (data ?? []).filter(w => w.id !== store.widget?.id)
})

// ── Palette ───────────────────────────────────────────────────────────────────
const ICONS: Record<WidgetType, unknown> = {
  Column:    Rows3,
  Row:       Columns3,
  Container: Square,
  Text:      Type,
  Button:    MousePointerClick,
  TextField: FormInput,
  RichText:  Pilcrow,
  ListView:  List,
  Icon:      Star,
  WidgetRef: Blocks,
}

const PALETTE: { type: WidgetType; label: string }[] = [
  { type: 'Column',    label: 'Column' },
  { type: 'Row',       label: 'Row' },
  { type: 'Container', label: 'Container' },
  { type: 'Text',      label: 'Text' },
  { type: 'Button',    label: 'Button' },
  { type: 'TextField', label: 'TextField' },
  { type: 'RichText',  label: 'RichText' },
  { type: 'ListView',  label: 'ListView' },
  { type: 'Icon',      label: 'Icon' },
]

function findNodeById(root: WidgetNode, id: string): WidgetNode | null {
  if (root.id === id) return root
  for (const c of root.children) {
    const r = findNodeById(c, id)
    if (r) return r
  }
  return null
}

function addWidget(type: WidgetType) {
  const targetId = store.selectedId ?? store.widget?.root.id
  if (!targetId) return
  const targetNode = store.widget ? findNodeById(store.widget.root, targetId) : null
  if (targetNode && canHaveChildren(targetNode.type)) {
    const newId = store.addChild(targetId, type)
    if (newId) store.select(newId)
  } else {
    const newId = store.addSibling(targetId, type)
    if (newId) store.select(newId)
  }
}

function addWidgetRef(widgetId: string, widgetName: string) {
  const targetId = store.selectedId ?? store.widget?.root.id
  if (!targetId) return
  const targetNode = store.widget ? findNodeById(store.widget.root, targetId) : null
  if (targetNode && canHaveChildren(targetNode.type)) {
    const newId = store.addWidgetRefAsChild(targetId, widgetId, widgetName)
    if (newId) store.select(newId)
  } else {
    const newId = store.addWidgetRefAsSibling(targetId, widgetId, widgetName)
    if (newId) store.select(newId)
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Widget palette -->
    <div class="px-2 py-2 border-b shrink-0">
      <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">Добавить</p>
      <div class="grid grid-cols-2 gap-1">
        <button
          v-for="w in PALETTE"
          :key="w.type"
          class="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-accent text-left transition-colors"
          @click="addWidget(w.type)"
        >
          <component :is="ICONS[w.type]" class="size-3 shrink-0 text-muted-foreground" />
          {{ w.label }}
        </button>
      </div>

      <!-- Project widgets list -->
      <template v-if="projectWidgets.length > 0">
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mt-3 mb-1.5">
          Мои виджеты
        </p>
        <div class="grid grid-cols-2 gap-1">
          <button
            v-for="w in projectWidgets"
            :key="w.id"
            class="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-accent text-left transition-colors text-violet-600 dark:text-violet-400"
            @click="addWidgetRef(w.id, w.name)"
          >
            <Blocks class="size-3 shrink-0" />
            <span class="truncate">{{ w.name }}</span>
          </button>
        </div>
      </template>
    </div>

    <!-- Tree header -->
    <div class="px-2 py-1.5 border-b shrink-0 space-y-1.5">
      <div class="flex items-center gap-1">
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 px-1">Дерево</p>
        <button
          class="p-1 rounded hover:bg-accent text-muted-foreground"
          title="Свернуть всё"
          @click="collapseAll"
        >
          <ChevronsDownUp class="size-3" />
        </button>
        <button
          class="p-1 rounded hover:bg-accent text-muted-foreground"
          title="Развернуть всё"
          @click="expandAll"
        >
          <ChevronsUpDown class="size-3" />
        </button>
      </div>
      <!-- Search -->
      <div class="relative">
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
        <input
          v-model="searchQuery"
          placeholder="Поиск..."
          class="w-full h-7 pl-6 pr-6 text-xs bg-muted/40 border rounded-md outline-none focus:border-primary transition-colors"
        />
        <button
          v-if="searchQuery"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent text-muted-foreground"
          @click="searchQuery = ''"
        >
          <X class="size-3" />
        </button>
      </div>
    </div>

    <!-- Tree -->
    <div class="flex-1 overflow-y-auto py-1 min-h-0">
      <TreeNode
        v-if="store.widget"
        :node="store.widget.root"
        :depth="0"
      />
    </div>

    <!-- Data source config: visible when widget is a list-item template -->
    <div v-if="isListItemWidget" class="border-t px-2 py-2 shrink-0 space-y-1.5 bg-blue-50/30 dark:bg-blue-900/10">
      <p class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
        Данные (Шаблон списка)
      </p>
      <Input
        placeholder="Таблица источника..."
        class="h-6 text-[11px] font-mono"
        :model-value="store.listItemMeta.dataSource.source"
        @update:model-value="store.updateListItemMeta({ dataSource: { type: 'table', source: $event } })"
      />
      <p class="text-[10px] text-muted-foreground">
        Выбери элемент → вкладка «Data» для привязки полей
      </p>
    </div>
  </div>
</template>
