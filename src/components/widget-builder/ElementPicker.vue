<script setup lang="ts">
import { ref, computed, inject, nextTick } from 'vue'
import type { ComputedRef } from 'vue'
import type { WidgetNode } from '@/types/widget-builder'
import type { WidgetElementsV2 } from '@/types/list-view'
import { supabase } from '@/lib/supabase'
import {
  Search, ChevronRight, ChevronDown,
  LayoutTemplate, Box, Check, X,
} from 'lucide-vue-next'

type NodeItem = { id: string; name: string; type: string }

const props = defineProps<{
  modelValue: string
  projectId: string
  currentWidgetId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// ── Current widget nodes (injected from NodeActionsPanel) ─────────────────
const currentWidgetNodes = inject<ComputedRef<NodeItem[]>>(
  'widgetNodes',
  { value: [] } as unknown as ComputedRef<NodeItem[]>,
)

// ── State ──────────────────────────────────────────────────────────────────
const open        = ref(false)
const search      = ref('')
const triggerRef  = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

// Dropdown position (set on open via getBoundingClientRect)
const dropStyle = ref({ top: '0px', left: '0px', width: '0px' })

type WidgetMeta = { id: string; name: string }
const otherWidgets      = ref<WidgetMeta[]>([])
const widgetsLoaded     = ref(false)
const expandedWidgetIds = ref<Set<string>>(new Set())
const loadedNodes       = ref<Record<string, NodeItem[]>>({})
const nodeLoading       = ref<Record<string, boolean>>({})

// ── Display label for current value ───────────────────────────────────────
const selectedLabel = computed(() => {
  if (!props.modelValue) return null
  if (props.modelValue.startsWith('w:')) {
    const wid = props.modelValue.slice(2)
    if (wid === props.currentWidgetId) return 'Этот виджет (целиком)'
    const w = otherWidgets.value.find(x => x.id === wid)
    return w ? `Виджет: ${w.name}` : `Виджет: ${wid.slice(0, 8)}`
  }
  const cur = currentWidgetNodes.value.find(n => n.id === props.modelValue)
  if (cur) return cur.name
  for (const nodes of Object.values(loadedNodes.value)) {
    const n = nodes.find(x => x.id === props.modelValue)
    if (n) return n.name
  }
  return props.modelValue.slice(0, 8) + '…'
})

// ── Open / close ──────────────────────────────────────────────────────────
async function openPicker() {
  // Calculate position BEFORE making dropdown visible
  if (triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect()
    const dropW = rect.width
    // Check if there's space below; if not, open above
    const spaceBelow = window.innerHeight - rect.bottom
    const dropH = 320 // max-h-80 = 320px
    const top = spaceBelow >= dropH
      ? rect.bottom + 4
      : rect.top - dropH - 4
    dropStyle.value = {
      top:   `${top}px`,
      left:  `${rect.left}px`,
      width: `${dropW}px`,
    }
  }
  open.value = true
  await nextTick()
  searchInput.value?.focus()
  if (!widgetsLoaded.value) loadOtherWidgets()
}

function close() {
  open.value = false
  search.value = ''
}

// ── Load other widgets list ───────────────────────────────────────────────
async function loadOtherWidgets() {
  if (!props.projectId) return
  const { data } = await supabase
    .from('ff_widgets')
    .select('id, name')
    .eq('project_id', props.projectId)
    .order('name')
  otherWidgets.value = (data ?? []).filter(w => w.id !== props.currentWidgetId)
  widgetsLoaded.value = true
}

// ── Toggle / lazy load other widget nodes ────────────────────────────────
async function toggleWidget(widgetId: string) {
  if (expandedWidgetIds.value.has(widgetId)) {
    expandedWidgetIds.value.delete(widgetId)
  } else {
    expandedWidgetIds.value.add(widgetId)
    if (!loadedNodes.value[widgetId] && !nodeLoading.value[widgetId]) {
      await fetchWidgetNodes(widgetId)
    }
  }
  expandedWidgetIds.value = new Set(expandedWidgetIds.value)
}

async function fetchWidgetNodes(widgetId: string) {
  nodeLoading.value[widgetId] = true
  try {
    const { data } = await supabase
      .from('ff_widgets')
      .select('elements')
      .eq('id', widgetId)
      .single()
    if (!data) return
    const nodes: NodeItem[] = []
    function collect(node: WidgetNode) {
      nodes.push({ id: node.id, name: node.name, type: node.type })
      node.children.forEach(collect)
    }
    const raw = data.elements
    let root: WidgetNode | null = null
    if (Array.isArray(raw) && raw[0]) {
      root = raw[0] as WidgetNode
    } else if (raw && (raw as { v?: number }).v === 2) {
      root = (raw as unknown as WidgetElementsV2).root as WidgetNode
    }
    if (root) collect(root)
    loadedNodes.value[widgetId] = nodes
  } finally {
    nodeLoading.value[widgetId] = false
  }
}

// ── Filtering ─────────────────────────────────────────────────────────────
const q = computed(() => search.value.trim().toLowerCase())

const filteredCurrentNodes = computed(() =>
  q.value
    ? currentWidgetNodes.value.filter(n => n.name.toLowerCase().includes(q.value))
    : currentWidgetNodes.value
)

function filteredWidgetNodes(widgetId: string): NodeItem[] {
  const nodes = loadedNodes.value[widgetId] ?? []
  return q.value ? nodes.filter(n => n.name.toLowerCase().includes(q.value)) : nodes
}

// ── Selection ─────────────────────────────────────────────────────────────
function select(value: string) {
  emit('update:modelValue', value)
  close()
}
</script>

<template>
  <div ref="triggerRef">
    <!-- Trigger button -->
    <button
      type="button"
      class="w-full h-8 flex items-center gap-2 px-3 rounded-md border bg-background text-sm text-left hover:bg-muted/40 transition-colors"
      @click="openPicker"
    >
      <Box class="size-3.5 text-muted-foreground shrink-0" />
      <span v-if="selectedLabel" class="flex-1 truncate">{{ selectedLabel }}</span>
      <span v-else class="flex-1 truncate text-muted-foreground">Выберите элемент</span>
      <button
        v-if="modelValue"
        type="button"
        class="shrink-0 text-muted-foreground hover:text-foreground"
        @click.stop="emit('update:modelValue', '')"
      >
        <X class="size-3" />
      </button>
    </button>

    <!-- Teleported: overlay + dropdown rendered at <body> level, bypasses overflow:hidden -->
    <Teleport to="body">
      <!-- Click-outside overlay -->
      <div v-if="open" class="fixed inset-0 z-[9998]" @click="close" />

      <!-- Dropdown panel -->
      <div
        v-if="open"
        class="fixed z-[9999] flex flex-col rounded-lg border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden"
        style="max-height: 320px;"
        :style="dropStyle"
      >
        <!-- Search -->
        <div class="p-2 border-b border-border shrink-0">
          <div class="relative">
            <Search class="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <input
              ref="searchInput"
              v-model="search"
              placeholder="Поиск..."
              class="w-full h-7 pl-6 pr-2 text-xs bg-muted/50 border border-input rounded outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div class="overflow-y-auto flex-1 picker-scroll">
          <!-- ── Текущий виджет ───────────────────────────────────────────── -->
          <div>
            <p class="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Этот виджет
            </p>

            <button
              v-for="n in filteredCurrentNodes"
              :key="n.id"
              type="button"
              class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
              @click="select(n.id)"
            >
              <Check v-if="modelValue === n.id" class="size-3 text-primary shrink-0" />
              <span v-else class="size-3 shrink-0" />
              <span class="flex-1 truncate font-medium">{{ n.name }}</span>
              <span class="text-muted-foreground text-[10px] shrink-0">{{ n.type }}</span>
            </button>

            <div v-if="filteredCurrentNodes.length === 0" class="px-3 py-2 text-xs text-muted-foreground">
              Нет совпадений
            </div>
          </div>

          <!-- ── Другие виджеты ──────────────────────────────────────────── -->
          <div v-if="otherWidgets.length > 0 || !widgetsLoaded" class="border-t border-border mt-1">
            <p class="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Другие виджеты
            </p>

            <div v-if="!widgetsLoaded" class="px-3 py-2 text-xs text-muted-foreground animate-pulse">
              Загрузка...
            </div>

            <div v-for="widget in otherWidgets" :key="widget.id">
              <!-- Widget row -->
              <div class="flex items-center hover:bg-accent transition-colors">
                <button
                  type="button"
                  class="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-1.5 text-xs text-left"
                  @click="toggleWidget(widget.id)"
                >
                  <component
                    :is="expandedWidgetIds.has(widget.id) ? ChevronDown : ChevronRight"
                    class="size-3 text-muted-foreground shrink-0"
                  />
                  <LayoutTemplate class="size-3 text-muted-foreground shrink-0" />
                  <span class="truncate font-medium">{{ widget.name }}</span>
                </button>
                <!-- Select whole widget -->
                <button
                  type="button"
                  class="px-2 py-1.5 text-[10px] text-primary font-medium shrink-0 hover:underline"
                  @click="select('w:' + widget.id)"
                >
                  целиком
                </button>
                <Check
                  v-if="modelValue === 'w:' + widget.id"
                  class="size-3 text-primary mr-2 shrink-0"
                />
              </div>

              <!-- Widget nodes (expanded) -->
              <div v-if="expandedWidgetIds.has(widget.id)" class="bg-muted/20">
                <div
                  v-if="nodeLoading[widget.id]"
                  class="pl-8 pr-3 py-2 text-xs text-muted-foreground animate-pulse"
                >
                  Загрузка элементов...
                </div>
                <template v-else>
                  <button
                    v-for="n in filteredWidgetNodes(widget.id)"
                    :key="n.id"
                    type="button"
                    class="w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-xs text-left hover:bg-accent transition-colors min-w-0"
                    @click="select(n.id)"
                  >
                    <Check v-if="modelValue === n.id" class="size-3 text-primary shrink-0" />
                    <span v-else class="size-3 shrink-0" />
                    <span class="flex-1 truncate">{{ n.name }}</span>
                    <span class="text-muted-foreground text-[10px] shrink-0">{{ n.type }}</span>
                  </button>
                  <div
                    v-if="filteredWidgetNodes(widget.id).length === 0"
                    class="pl-8 pr-3 py-1.5 text-xs text-muted-foreground"
                  >
                    Нет элементов
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Themed scrollbar — uses shadcn CSS variables, adapts to light/dark automatically */
.picker-scroll {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}
.picker-scroll::-webkit-scrollbar {
  width: 4px;
}
.picker-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.picker-scroll::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 2px;
}
.picker-scroll::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.4);
}
</style>
