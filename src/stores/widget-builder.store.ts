import { defineStore } from 'pinia'
import { ref, computed, watchEffect } from 'vue'
import { nanoid } from 'nanoid'
import type { WidgetNode, WidgetType, WidgetNodeProps, WidgetDefinition } from '@/types/widget-builder'
import type { WidgetKind, ListItemMeta, DataBindingProperty } from '@/types/list-view'
import {
  createDefaultNode, findNode, findParent, removeNode,
  canHaveChildren, buildIndex,
} from '@/composables/useWidgetTree'
import { supabase } from '@/lib/supabase'

const DEFAULT_LIST_ITEM_META = (): ListItemMeta => ({
  dataSource: { type: 'table', source: '' },
  dataBindings: [],
})

export const useWidgetBuilderStore = defineStore('widgetBuilder', () => {
  const widget = ref<WidgetDefinition | null>(null)
  const selectedId = ref<string | null>(null)
  const isDirty = ref(false)

  // Widget-level metadata (not node-level)
  const widgetKind = ref<WidgetKind>('standard')
  const listItemMeta = ref<ListItemMeta>(DEFAULT_LIST_ITEM_META())

  // Flat index for O(1) node access — stores REFERENCES to original nodes
  const index = ref<Map<string, WidgetNode>>(new Map())

  watchEffect(() => {
    if (!widget.value) return
    index.value = buildIndex(widget.value.root)
  })

  const selectedNode = computed(() =>
    selectedId.value ? (index.value.get(selectedId.value) ?? null) : null
  )

  // ── Load ─────────────────────────────────────────────────────────────────

  async function load(widgetId: string) {
    const { data, error } = await supabase
      .from('ff_widgets')
      .select('*')
      .eq('id', widgetId)
      .single()
    if (error) throw error

    const raw = data.elements as unknown

    let root: WidgetNode
    let kind: WidgetKind = 'standard'
    let meta: ListItemMeta = DEFAULT_LIST_ITEM_META()

    if (Array.isArray(raw)) {
      // Legacy v1 format: [WidgetNode]
      root = (raw[0] as WidgetNode | undefined) ?? createDefaultNode('Column')
    } else if (raw && typeof raw === 'object' && (raw as Record<string, unknown>).v === 2) {
      // Current v2 format
      const v2 = raw as Record<string, unknown>
      root = (v2.root as WidgetNode | undefined) ?? createDefaultNode('Column')
      kind = (v2.widgetKind as WidgetKind | undefined) ?? 'standard'
      meta = (v2.listItemMeta as ListItemMeta | undefined) ?? DEFAULT_LIST_ITEM_META()
    } else {
      root = createDefaultNode('Column')
    }

    widget.value = {
      id: data.id,
      projectId: data.project_id,
      name: data.name,
      root,
    }
    widgetKind.value = kind
    listItemMeta.value = meta
    selectedId.value = root.id
    isDirty.value = false
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function save() {
    if (!widget.value) return
    const elements = {
      v: 2,
      root: widget.value.root,
      widgetKind: widgetKind.value,
      listItemMeta: listItemMeta.value,
    }
    const { error } = await supabase
      .from('ff_widgets')
      .update({ elements })
      .eq('id', widget.value.id)
    if (error) throw error
    isDirty.value = false
  }

  // ── Selection ────────────────────────────────────────────────────────────

  function select(id: string | null) {
    selectedId.value = id
  }

  // ── Node props update ─────────────────────────────────────────────────────

  function updateProps(id: string, patch: Partial<WidgetNodeProps>) {
    const node = index.value.get(id)
    if (!node) return
    // Deep-merge for nested objects (padding, margin, border, listViewConfig, etc.)
    for (const key of Object.keys(patch) as (keyof WidgetNodeProps)[]) {
      const val = patch[key]
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        if (node.props[key] === undefined || node.props[key] === null) {
          // @ts-expect-error dynamic key
          node.props[key] = val
        } else {
          Object.assign(node.props[key] as object, val)
        }
      } else {
        // @ts-expect-error dynamic key
        node.props[key] = val
      }
    }
    isDirty.value = true
  }

  function renameNode(id: string, name: string) {
    const node = index.value.get(id)
    if (!node) return
    node.name = name
    isDirty.value = true
  }

  // ── Widget kind ───────────────────────────────────────────────────────────

  function setWidgetKind(kind: WidgetKind) {
    widgetKind.value = kind
    isDirty.value = true
  }

  // ── ListItem metadata ─────────────────────────────────────────────────────

  function updateListItemMeta(patch: Partial<ListItemMeta>) {
    Object.assign(listItemMeta.value, patch)
    isDirty.value = true
  }

  function setDataBinding(nodeId: string, property: DataBindingProperty, field: string) {
    const idx = listItemMeta.value.dataBindings.findIndex(
      b => b.nodeId === nodeId && b.property === property,
    )
    if (field === '') {
      if (idx !== -1) listItemMeta.value.dataBindings.splice(idx, 1)
    } else {
      if (idx !== -1) {
        listItemMeta.value.dataBindings[idx].field = field
      } else {
        listItemMeta.value.dataBindings.push({ nodeId, property, field })
      }
    }
    isDirty.value = true
  }

  function removeDataBinding(nodeId: string, property: DataBindingProperty) {
    const idx = listItemMeta.value.dataBindings.findIndex(
      b => b.nodeId === nodeId && b.property === property,
    )
    if (idx !== -1) listItemMeta.value.dataBindings.splice(idx, 1)
    isDirty.value = true
  }

  // ── Tree operations ───────────────────────────────────────────────────────

  function addChild(parentId: string, type: WidgetType): string | null {
    const parent = index.value.get(parentId)
    if (!parent || !canHaveChildren(parent.type)) return null
    const child = createDefaultNode(type)
    parent.children.push(child)
    isDirty.value = true
    return child.id
  }

  function addSibling(siblingId: string, type: WidgetType): string | null {
    if (!widget.value) return null
    const parent = findParent(widget.value.root, siblingId)
    if (!parent) return null
    const idx = parent.children.findIndex(c => c.id === siblingId)
    const child = createDefaultNode(type)
    parent.children.splice(idx + 1, 0, child)
    isDirty.value = true
    return child.id
  }

  function deleteNode(id: string) {
    if (!widget.value || id === widget.value.root.id) return
    removeNode(widget.value.root, id)
    if (selectedId.value === id) selectedId.value = null
    isDirty.value = true
  }

  function moveUp(id: string) {
    if (!widget.value) return
    const parent = findParent(widget.value.root, id)
    if (!parent) return
    const idx = parent.children.findIndex(c => c.id === id)
    if (idx <= 0) return
    const [node] = parent.children.splice(idx, 1)
    parent.children.splice(idx - 1, 0, node)
    isDirty.value = true
  }

  function moveDown(id: string) {
    if (!widget.value) return
    const parent = findParent(widget.value.root, id)
    if (!parent) return
    const idx = parent.children.findIndex(c => c.id === id)
    if (idx >= parent.children.length - 1) return
    const [node] = parent.children.splice(idx, 1)
    parent.children.splice(idx + 1, 0, node)
    isDirty.value = true
  }

  function wrapInColumn(id: string) {
    if (!widget.value) return
    const parent = findParent(widget.value.root, id)
    if (!parent) return
    const idx = parent.children.findIndex(c => c.id === id)
    const node = parent.children[idx]
    const wrapper = createDefaultNode('Column')
    wrapper.children.push(node)
    parent.children.splice(idx, 1, wrapper)
    isDirty.value = true
  }

  function $reset() {
    widget.value = null
    selectedId.value = null
    isDirty.value = false
    index.value = new Map()
    widgetKind.value = 'standard'
    listItemMeta.value = DEFAULT_LIST_ITEM_META()
  }

  return {
    widget, selectedId, selectedNode, isDirty,
    widgetKind, listItemMeta,
    load, save, select, $reset,
    updateProps, renameNode,
    setWidgetKind, updateListItemMeta, setDataBinding, removeDataBinding,
    addChild, addSibling, deleteNode, moveUp, moveDown, wrapInColumn,
  }
})
