<script setup lang="ts">
import { ref, onMounted, computed, inject, shallowRef } from 'vue'
import type { ShallowRef } from 'vue'
import type { WidgetNode, RichTextSpan } from '@/types/widget-builder'
import type { DataBinding, ListViewConfig, WidgetElementsV2 } from '@/types/list-view'
import { nodeToStyle } from '@/composables/useWidgetCss'
import { loadGoogleFont } from '@/composables/useGoogleFonts'
import { useActionExecutor } from '@/composables/useActionExecutor'
import { useVisibilityStore } from '@/stores/visibility.store'
import { supabase } from '@/lib/supabase'
import { DataSourceService } from '@/services/DataSourceService'
import { resolveIcon } from '@/registry/icon-packages'

const props = defineProps<{
  node: WidgetNode
}>()

const nodeStyle = () => nodeToStyle(props.node)
const visibilityStore = useVisibilityStore()
const { executeAll } = useActionExecutor()

// Runtime visibility: visibilityStore overrides design-time hidden flag
const runtimeVisible = computed(() =>
  visibilityStore.isVisible(props.node.id, !props.node.hidden)
)

const resolvedIcon = computed(() =>
  props.node.type === 'Icon'
    ? resolveIcon(props.node.props.iconPackage, props.node.props.iconName)
    : null
)

// ── Action handlers ─────────────────────────────────────────────────────────
function handleClick() {
  executeAll(props.node.actions?.onClick)
}

function handleHover() {
  executeAll(props.node.actions?.onHover)
}

function handleChange() {
  executeAll(props.node.actions?.onChange)
}

function handleSubmit() {
  executeAll(props.node.actions?.onSubmit)
}

// ── ListView runtime ───────────────────────────────────────────────────────
const listRows         = ref<Record<string, unknown>[]>([])
const listItemRoot     = ref<WidgetNode | null>(null)
const listItemBindings = ref<DataBinding[]>([])
const listLoading      = ref(false)
const listError        = ref<string | null>(null)

// Injected from PagePreviewView (per-project Supabase client); falls back to global
const dataService = inject<ShallowRef<DataSourceService>>(
  'dataService',
  shallowRef(new DataSourceService()),
)

/**
 * Deep-clone a node tree and substitute bound props from a data row.
 */
function applyBindings(
  node: WidgetNode,
  bindings: DataBinding[],
  row: Record<string, unknown>,
): WidgetNode {
  const hits = bindings.filter(b => b.nodeId === node.id)
  let p = { ...node.props }
  for (const b of hits) {
    const val = String(row[b.field] ?? '')
    if (b.property === 'text')        p = { ...p, text: val }
    if (b.property === 'placeholder') p = { ...p, placeholder: val }
  }
  return {
    ...node,
    props: p,
    children: node.children.map(c => applyBindings(c, bindings, row)),
  }
}

onMounted(async () => {
  // Execute onInit actions for this node
  executeAll(props.node.actions?.onInit)

  if (props.node.type !== 'ListView') return

  const cfg = props.node.props.listViewConfig as ListViewConfig | undefined
  if (!cfg?.dataSource.source || !cfg.listItemWidgetId) return

  listLoading.value = true
  listError.value = null

  try {
    // 1. Fetch rows (uses injected per-project data service)
    const limit = cfg.pagination.enabled ? cfg.pagination.pageSize : undefined
    listRows.value = await dataService.value.fetchData(cfg.dataSource.source, {
      filters: cfg.filters,
      sorting: cfg.sorting,
      limit,
    })

    // 2. Load the list-item widget (once)
    const { data, error } = await supabase
      .from('ff_widgets')
      .select('elements')
      .eq('id', cfg.listItemWidgetId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Виджет-шаблон не найден')

    const raw = data.elements
    if (Array.isArray(raw) && raw[0]) {
      listItemRoot.value = raw[0] as WidgetNode
      listItemBindings.value = []
    } else if (raw && (raw as { v?: number }).v === 2) {
      const v2 = raw as unknown as WidgetElementsV2
      listItemRoot.value = v2.root as WidgetNode
      listItemBindings.value = v2.listItemMeta.dataBindings
    }
  } catch (e: unknown) {
    listError.value = (e as Error).message
  } finally {
    listLoading.value = false
  }
})

function spanStyle(span: RichTextSpan): Record<string, string> {
  const s: Record<string, string> = {}
  if (span.color)      s.color = span.color
  if (span.fontSize)   s.fontSize = `${span.fontSize}px`
  if (span.fontWeight) s.fontWeight = span.fontWeight
  if (span.fontFamily) {
    loadGoogleFont(span.fontFamily)
    s.fontFamily = `"${span.fontFamily}", sans-serif`
  }
  if (span.italic)    s.fontStyle = 'italic'
  if (span.underline) s.textDecoration = 'underline'
  return s
}
</script>

<template>
  <!-- Hidden nodes (design-time or runtime-overridden) are skipped -->
  <template v-if="!runtimeVisible" />

  <!-- Column / Row / Container -->
  <div
    v-else-if="node.type === 'Column' || node.type === 'Row' || node.type === 'Container'"
    :style="nodeStyle()"
    :class="node.actions?.onClick?.length ? 'cursor-pointer' : ''"
    @click="node.actions?.onClick?.length ? handleClick() : undefined"
  >
    <PreviewNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
    />
  </div>

  <!-- Text -->
  <span
    v-else-if="node.type === 'Text'"
    :style="nodeStyle()"
    :class="node.actions?.onClick?.length ? 'cursor-pointer' : ''"
    @click="node.actions?.onClick?.length ? handleClick() : undefined"
  >{{ node.props.text || '' }}</span>

  <!-- Button -->
  <button
    v-else-if="node.type === 'Button'"
    :style="{ ...nodeStyle(), cursor: 'pointer', border: 'none' }"
    @click="handleClick"
    @mouseover="node.actions?.onHover?.length ? handleHover() : undefined"
  >{{ node.props.text || 'Button' }}</button>

  <!-- TextField -->
  <input
    v-else-if="node.type === 'TextField'"
    :placeholder="node.props.placeholder || ''"
    :style="{ ...nodeStyle(), outline: 'none' }"
    @change="handleChange"
    @keydown.enter="handleSubmit"
  />

  <!-- RichText -->
  <p
    v-else-if="node.type === 'RichText'"
    :style="nodeStyle()"
    :class="node.actions?.onClick?.length ? 'cursor-pointer' : ''"
    @click="node.actions?.onClick?.length ? handleClick() : undefined"
  >
    <span
      v-for="span in (node.props.richSpans ?? [])"
      :key="span.id"
      :style="spanStyle(span)"
    >{{ span.text }}</span>
  </p>

  <!-- Icon -->
  <div
    v-else-if="node.type === 'Icon'"
    :style="nodeStyle()"
    :class="['inline-flex items-center justify-center', node.actions?.onClick?.length ? 'cursor-pointer' : '']"
    @click="node.actions?.onClick?.length ? handleClick() : undefined"
  >
    <component
      v-if="resolvedIcon"
      :is="resolvedIcon"
      :size="node.props.iconSize ?? 24"
      :color="node.props.iconColor || 'currentColor'"
      :stroke-width="node.props.iconStrokeWidth ?? 2"
    />
  </div>

  <!-- ListView — runtime render -->
  <div v-else-if="node.type === 'ListView'" :style="{ width: nodeStyle().width }">
    <!-- Loading -->
    <div v-if="listLoading" class="text-xs text-gray-400 text-center py-4 animate-pulse">
      Загрузка данных...
    </div>
    <!-- Error -->
    <div v-else-if="listError" class="text-xs text-red-400 text-center py-4">
      {{ listError }}
    </div>
    <!-- Rows -->
    <template v-else-if="listItemRoot">
      <PreviewNode
        v-for="(row, idx) in listRows"
        :key="idx"
        :node="applyBindings(listItemRoot, listItemBindings, row)"
      />
      <div v-if="listRows.length === 0" class="text-xs text-gray-400 text-center py-4">
        Нет данных
      </div>
    </template>
    <!-- No template configured -->
    <div v-else class="text-xs text-gray-400 text-center py-4">
      Шаблон не настроен
    </div>
  </div>
</template>
