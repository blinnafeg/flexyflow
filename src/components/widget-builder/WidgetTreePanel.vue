<script setup lang="ts">
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { canHaveChildren } from '@/composables/useWidgetTree'
import type { WidgetNode, WidgetType } from '@/types/widget-builder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Rows3, Columns3, Square, Type, MousePointerClick,
  FormInput, Pilcrow, List, ChevronDown, ChevronRight, Trash2, ArrowUp, ArrowDown,
} from 'lucide-vue-next'
import { ref, computed } from 'vue'

const store = useWidgetBuilderStore()
const collapsed = ref<Set<string>>(new Set())

const isListItemWidget = computed(() => store.widgetKind === 'list-item')

const ICONS: Record<WidgetType, unknown> = {
  Column:    Rows3,
  Row:       Columns3,
  Container: Square,
  Text:      Type,
  Button:    MousePointerClick,
  TextField: FormInput,
  RichText:  Pilcrow,
  ListView:  List,
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
]

function toggleCollapse(id: string) {
  if (collapsed.value.has(id)) collapsed.value.delete(id)
  else collapsed.value.add(id)
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

function findNodeById(root: WidgetNode, id: string): WidgetNode | null {
  if (root.id === id) return root
  for (const c of root.children) {
    const r = findNodeById(c, id)
    if (r) return r
  }
  return null
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
    </div>

    <!-- Tree -->
    <div class="flex-1 overflow-y-auto py-1 min-h-0">
      <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">Дерево</p>
      <TreeNode
        v-if="store.widget"
        :node="store.widget.root"
        :depth="0"
        :collapsed="collapsed"
        @toggle="toggleCollapse"
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

<!-- Recursive tree node as local component -->
<script lang="ts">
import { defineComponent, h, computed } from 'vue'

const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    node: { type: Object as () => WidgetNode, required: true },
    depth: { type: Number, default: 0 },
    collapsed: { type: Object as () => Set<string>, required: true },
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    const store = useWidgetBuilderStore()
    const isSelected = computed(() => store.selectedId === props.node.id)
    const isCollapsed = computed(() => props.collapsed.has(props.node.id))
    const hasChildren = computed(() => props.node.children.length > 0)

    const ICONS_MAP: Record<WidgetType, unknown> = {
      Column:    Rows3,
      Row:       Columns3,
      Container: Square,
      Text:      Type,
      Button:    MousePointerClick,
      TextField: FormInput,
      RichText:  Pilcrow,
      ListView:  List,
    }

    return () => {
      const paddingLeft = `${props.depth * 12 + 8}px`
      const icon = ICONS_MAP[props.node.type as WidgetType]

      const row = h('div', {
        class: [
          'flex items-center gap-1 pr-1 py-0.5 cursor-pointer select-none group',
          isSelected.value ? 'bg-primary/10 text-primary' : 'hover:bg-accent/50',
        ],
        style: { paddingLeft },
        onClick: (e: MouseEvent) => { e.stopPropagation(); store.select(props.node.id) },
      }, [
        // Chevron toggle
        h('span', {
          class: 'size-4 flex items-center justify-center shrink-0',
          onClick: (e: MouseEvent) => { e.stopPropagation(); if (hasChildren.value) emit('toggle', props.node.id) },
        }, hasChildren.value
          ? h(isCollapsed.value ? ChevronRight : ChevronDown, { class: 'size-3' })
          : h('span', { class: 'size-3' })
        ),
        // Type icon
        h(icon as any, { class: 'size-3 shrink-0 text-muted-foreground' }),
        // Name
        h('span', { class: 'text-xs flex-1 truncate' }, props.node.name),
        // Actions (visible on hover/selected)
        ...(isSelected.value ? [
          h('button', {
            class: 'opacity-0 group-hover:opacity-100 hover:text-primary',
            title: 'Вверх',
            onClick: (e: MouseEvent) => { e.stopPropagation(); store.moveUp(props.node.id) },
          }, h(ArrowUp, { class: 'size-3' })),
          h('button', {
            class: 'opacity-0 group-hover:opacity-100 hover:text-primary',
            title: 'Вниз',
            onClick: (e: MouseEvent) => { e.stopPropagation(); store.moveDown(props.node.id) },
          }, h(ArrowDown, { class: 'size-3' })),
          h('button', {
            class: 'opacity-0 group-hover:opacity-100 hover:text-destructive',
            title: 'Удалить',
            onClick: (e: MouseEvent) => { e.stopPropagation(); store.deleteNode(props.node.id) },
          }, h(Trash2, { class: 'size-3' })),
        ] : []),
      ])

      const children = (!isCollapsed.value && hasChildren.value)
        ? h('div', {}, props.node.children.map(child =>
            h(TreeNode, {
              key: child.id,
              node: child,
              depth: props.depth + 1,
              collapsed: props.collapsed,
              onToggle: (id: string) => emit('toggle', id),
            })
          ))
        : null

      return h('div', {}, [row, children])
    }
  },
})
export { TreeNode }
</script>
