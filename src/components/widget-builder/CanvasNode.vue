<script setup lang="ts">
import { computed } from 'vue'
import type { WidgetNode, RichTextSpan } from '@/types/widget-builder'
import { nodeToStyle } from '@/composables/useWidgetCss'
import { loadGoogleFont } from '@/composables/useGoogleFonts'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { resolveIcon } from '@/registry/icon-packages'
import { Badge } from '@/components/ui/badge'

const props = defineProps<{
  node: WidgetNode
  editorMode?: boolean  // false = публичный рендер без выделения
}>()

const store = useWidgetBuilderStore()
const isSelected = computed(() => props.editorMode && store.selectedId === props.node.id)
const nodeStyle  = computed(() => nodeToStyle(props.node))
const isHidden   = computed(() => !!props.node.hidden)
const isLocked   = computed(() => !!props.node.locked)
const resolvedIcon = computed(() =>
  props.node.type === 'Icon'
    ? resolveIcon(props.node.props.iconPackage, props.node.props.iconName)
    : null
)

const slotItems = computed(() => {
  const p = props.node.props
  if (p.widgetRefIds?.length) return p.widgetRefIds
  if (p.widgetRefId) return [{ id: p.widgetRefId, name: props.node.name }]
  return []
})

function onClick(e: MouseEvent) {
  if (!props.editorMode) return
  e.stopPropagation()
  store.select(props.node.id)
}

// Classes applied to every rendered node in editor mode
const editorOverlayClass = computed(() => {
  if (!props.editorMode) return ''
  const parts: string[] = []
  if (isHidden.value)  parts.push('opacity-30')
  if (isLocked.value && !isHidden.value) parts.push('outline-dashed outline-1 outline-amber-400/60')
  return parts.join(' ')
})

function spanStyle(span: RichTextSpan): Record<string, string> {
  const s: Record<string, string> = {}
  if (span.color) s.color = span.color
  if (span.fontSize) s.fontSize = `${span.fontSize}px`
  if (span.fontWeight) s.fontWeight = span.fontWeight
  if (span.fontFamily) {
    loadGoogleFont(span.fontFamily)
    s.fontFamily = `"${span.fontFamily}", sans-serif`
  }
  if (span.italic) s.fontStyle = 'italic'
  if (span.underline) s.textDecoration = 'underline'
  return s
}
</script>

<template>
  <!-- Column / Row / Container -->
  <div
    v-if="node.type === 'Column' || node.type === 'Row' || node.type === 'Container'"
    :style="nodeStyle"
    :class="[isSelected ? 'outline outline-2 outline-blue-500' : '', editorOverlayClass]"
    @click="onClick"
  >
    <CanvasNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :editor-mode="editorMode"
    />
    <!-- Empty placeholder in editor -->
    <div
      v-if="editorMode && node.children.length === 0"
      class="text-xs text-gray-400 p-2 border border-dashed border-gray-300 rounded w-full text-center select-none"
    >
      {{ node.name }}
    </div>
  </div>

  <!-- Text -->
  <span
    v-else-if="node.type === 'Text'"
    :style="nodeStyle"
    :class="[isSelected ? 'outline outline-2 outline-blue-500' : '', editorOverlayClass]"
    @click="onClick"
  >{{ node.props.text || '' }}</span>

  <!-- Button -->
  <button
    v-else-if="node.type === 'Button'"
    :style="{ ...nodeStyle, cursor: 'pointer', border: 'none' }"
    :class="[isSelected ? 'outline outline-2 outline-blue-500' : '', editorOverlayClass]"
    @click="onClick"
  >{{ node.props.text || 'Button' }}</button>

  <!-- TextField -->
  <input
    v-else-if="node.type === 'TextField'"
    :placeholder="node.props.placeholder || ''"
    :style="{ ...nodeStyle, outline: 'none' }"
    :class="[isSelected ? 'ring-2 ring-blue-500' : '', editorOverlayClass]"
    readonly
    @click="onClick"
  />

  <!-- RichText -->
  <p
    v-else-if="node.type === 'RichText'"
    :style="nodeStyle"
    :class="[isSelected ? 'outline outline-2 outline-blue-500' : '', editorOverlayClass]"
    @click="onClick"
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
    :style="nodeStyle"
    :class="['inline-flex items-center justify-center', isSelected ? 'outline outline-2 outline-blue-500' : '', editorOverlayClass]"
    @click="onClick"
  >
    <component
      v-if="resolvedIcon"
      :is="resolvedIcon"
      :size="node.props.iconSize ?? 24"
      :color="node.props.iconColor || 'currentColor'"
      :stroke-width="node.props.iconStrokeWidth ?? 2"
    />
    <span
      v-else
      class="text-xs text-muted-foreground font-mono border border-dashed border-gray-300 rounded px-1.5 py-0.5 select-none"
    >icon</span>
  </div>

  <!-- WidgetRef / Slot — editor placeholder -->
  <div
    v-else-if="node.type === 'WidgetRef'"
    :style="{ width: nodeStyle.width, padding: nodeStyle.padding, margin: nodeStyle.margin }"
    :class="[
      'flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed min-h-[48px] select-none cursor-pointer transition-colors p-2',
      isSelected
        ? 'border-violet-500 bg-violet-500/5'
        : 'border-violet-300/60 bg-violet-50/30 hover:bg-violet-50/60 dark:bg-violet-900/10',
      editorOverlayClass,
    ]"
    @click="onClick"
  >
    <div class="text-[11px] font-semibold text-violet-500">Slot</div>
    <div v-if="slotItems.length === 0" class="text-[10px] text-muted-foreground/60 italic">Не настроен</div>
    <div v-else class="flex flex-wrap gap-1 justify-center max-w-[160px]">
      <Badge
        v-for="w in slotItems"
        :key="w.id"
        variant="secondary"
        class="text-[9px] px-1.5 py-0 text-violet-600 bg-violet-100 dark:bg-violet-900/30"
      >
        {{ w.name }}
      </Badge>
    </div>
  </div>

  <!-- ListView — editor placeholder showing config summary -->
  <div
    v-else-if="node.type === 'ListView'"
    :style="{ width: nodeStyle.width, padding: nodeStyle.padding, margin: nodeStyle.margin }"
    :class="[
      'flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed min-h-[80px] select-none cursor-pointer transition-colors',
      isSelected
        ? 'border-blue-500 bg-blue-500/5'
        : 'border-blue-300/60 bg-blue-50/30 hover:bg-blue-50/60 dark:bg-blue-900/10',
      editorOverlayClass,
    ]"
    @click="onClick"
  >
    <div class="text-[11px] font-semibold text-blue-500">ListView</div>
    <div
      v-if="node.props.listViewConfig?.dataSource.source"
      class="font-mono text-[10px] text-muted-foreground"
    >
      {{ node.props.listViewConfig.dataSource.source }}
    </div>
    <div v-else class="text-[10px] text-muted-foreground/60 italic">
      Источник не задан
    </div>
    <div
      v-if="node.props.listViewConfig?.listItemWidgetId"
      class="text-[10px] text-blue-400"
    >
      Шаблон: настроен
    </div>
  </div>
</template>
