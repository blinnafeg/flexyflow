import { defineStore } from 'pinia'
import { ref, computed, watchEffect } from 'vue'
import { nanoid } from 'nanoid'
import type { WidgetNode, WidgetType, WidgetNodeProps, WidgetDefinition, NodeActions } from '@/types/widget-builder'
import type { BreakpointId } from '@/types/breakpoints'

// Deep-clone a node tree with fresh IDs
function deepCloneNode(node: WidgetNode): WidgetNode {
  return {
    ...node,
    id: nanoid(8),
    props: JSON.parse(JSON.stringify(node.props)),
    children: node.children.map(deepCloneNode),
  }
}

// Check if 'ancestorId' is an ancestor of 'nodeId' in the tree
function isAncestorOf(root: WidgetNode, ancestorId: string, nodeId: string): boolean {
  function check(n: WidgetNode): boolean {
    if (n.id === nodeId) return true
    return n.children.some(check)
  }
  const ancestor = findNodeInTree(root, ancestorId)
  return ancestor ? ancestor.children.some(check) : false
}

function findNodeInTree(node: WidgetNode, id: string): WidgetNode | null {
  if (node.id === id) return node
  for (const c of node.children) {
    const r = findNodeInTree(c, id)
    if (r) return r
  }
  return null
}
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
  const selectedIds = ref<Set<string>>(new Set())
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

  const isMultiSelect = computed(() => selectedIds.value.size > 1)

  const selectedNodes = computed(() =>
    [...selectedIds.value].map(id => index.value.get(id)).filter(Boolean) as WidgetNode[]
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
    selectedIds.value = new Set([root.id])
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
    selectedIds.value = id ? new Set([id]) : new Set()
  }

  function toggleSelectNode(id: string) {
    const set = new Set(selectedIds.value)
    if (set.has(id) && set.size > 1) {
      set.delete(id)
      if (selectedId.value === id) selectedId.value = [...set][0] ?? null
    } else {
      set.add(id)
      selectedId.value = id
    }
    selectedIds.value = set
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

  function updatePropsSelected(patch: Partial<WidgetNodeProps>) {
    for (const id of selectedIds.value) {
      updateProps(id, patch)
    }
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

  // Creates a WidgetRef/Slot node with initial widgetRefIds set before insertion
  function addWidgetRefAsChild(parentId: string, widgetRefId: string, name: string): string | null {
    const parent = index.value.get(parentId)
    if (!parent || !canHaveChildren(parent.type)) return null
    const child = createDefaultNode('WidgetRef')
    child.props.widgetRefIds = [{ id: widgetRefId, name }]
    child.name = name
    parent.children.push(child)
    isDirty.value = true
    return child.id
  }

  function addWidgetRefAsSibling(siblingId: string, widgetRefId: string, name: string): string | null {
    if (!widget.value) return null
    const parent = findParent(widget.value.root, siblingId)
    if (!parent) return null
    const idx = parent.children.findIndex(c => c.id === siblingId)
    const child = createDefaultNode('WidgetRef')
    child.props.widgetRefIds = [{ id: widgetRefId, name }]
    child.name = name
    parent.children.splice(idx + 1, 0, child)
    isDirty.value = true
    return child.id
  }

  function updateSlotItems(nodeId: string, items: { id: string; name: string }[]) {
    const node = index.value.get(nodeId)
    if (!node) return
    node.props.widgetRefIds = items
    isDirty.value = true
  }

  function deleteNode(id: string) {
    if (!widget.value || id === widget.value.root.id) return
    removeNode(widget.value.root, id)
    const s = new Set(selectedIds.value)
    s.delete(id)
    selectedIds.value = s
    if (selectedId.value === id) selectedId.value = [...s][0] ?? null
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

  function wrapIn(id: string, wrapperType: WidgetType) {
    if (!widget.value || !canHaveChildren(wrapperType)) return
    if (id === widget.value.root.id) return // cannot wrap root
    const parent = findParent(widget.value.root, id)
    if (!parent) return
    const idx = parent.children.findIndex(c => c.id === id)
    const node = parent.children[idx]
    const wrapper = createDefaultNode(wrapperType)
    wrapper.children.push(node)
    parent.children.splice(idx, 1, wrapper)
    selectedId.value = wrapper.id
    isDirty.value = true
  }

  function duplicateNode(id: string): string | null {
    if (!widget.value || id === widget.value.root.id) return null
    const parent = findParent(widget.value.root, id)
    if (!parent) return null
    const idx = parent.children.findIndex(c => c.id === id)
    const clone = deepCloneNode(parent.children[idx])
    parent.children.splice(idx + 1, 0, clone)
    isDirty.value = true
    return clone.id
  }

  function moveNode(dragId: string, targetId: string, position: 'before' | 'after' | 'inside') {
    if (!widget.value || dragId === targetId) return
    if (dragId === widget.value.root.id) return // cannot move root
    // Prevent dropping into own descendant
    if (isAncestorOf(widget.value.root, dragId, targetId)) return

    const draggedParent = findParent(widget.value.root, dragId)
    if (!draggedParent) return

    if (position === 'inside') {
      const targetNode = index.value.get(targetId)
      if (!targetNode || !canHaveChildren(targetNode.type)) return
      const dragIdx = draggedParent.children.findIndex(c => c.id === dragId)
      const [draggedNode] = draggedParent.children.splice(dragIdx, 1)
      targetNode.children.push(draggedNode)
    } else {
      const targetParent = findParent(widget.value.root, targetId)
      if (!targetParent) return
      const dragIdx = draggedParent.children.findIndex(c => c.id === dragId)
      const [draggedNode] = draggedParent.children.splice(dragIdx, 1)
      // Re-find target index (may shift if same parent and drag was before target)
      const targetIdx = targetParent.children.findIndex(c => c.id === targetId)
      if (targetIdx === -1) {
        draggedParent.children.splice(dragIdx, 0, draggedNode) // revert
        return
      }
      const insertIdx = position === 'before' ? targetIdx : targetIdx + 1
      targetParent.children.splice(insertIdx, 0, draggedNode)
    }
    isDirty.value = true
  }

  function toggleNodeVisibility(id: string) {
    const node = index.value.get(id)
    if (!node) return
    node.hidden = !node.hidden
    isDirty.value = true
  }

  function toggleNodeLock(id: string) {
    const node = index.value.get(id)
    if (!node) return
    node.locked = !node.locked
    isDirty.value = true
  }

  function updateNodeActions(id: string, actions: NodeActions) {
    const node = index.value.get(id)
    if (!node) return
    node.actions = actions
    isDirty.value = true
  }

  /**
   * Set visibility for a specific breakpoint.
   * visible=false  → hidden at that breakpoint
   * visible=null   → remove override (default: visible)
   */
  function setBreakpointVisibility(nodeId: string, bpId: BreakpointId, visible: boolean | null) {
    const node = index.value.get(nodeId)
    if (!node) return
    const cur: Partial<Record<BreakpointId, boolean>> = { ...(node.breakpointVisibility ?? {}) }
    if (visible === null) {
      delete cur[bpId]
    } else {
      cur[bpId] = visible
    }
    node.breakpointVisibility = Object.keys(cur).length > 0 ? cur : undefined
    isDirty.value = true
  }

  function $reset() {
    widget.value = null
    selectedId.value = null
    selectedIds.value = new Set()
    isDirty.value = false
    index.value = new Map()
    widgetKind.value = 'standard'
    listItemMeta.value = DEFAULT_LIST_ITEM_META()
  }

  return {
    widget, selectedId, selectedIds, selectedNode, selectedNodes, isMultiSelect, isDirty,
    widgetKind, listItemMeta,
    load, save, select, toggleSelectNode, $reset,
    updateProps, updatePropsSelected, renameNode,
    setWidgetKind, updateListItemMeta, setDataBinding, removeDataBinding,
    addChild, addSibling, addWidgetRefAsChild, addWidgetRefAsSibling, updateSlotItems,
    deleteNode, moveUp, moveDown, wrapInColumn,
    wrapIn, duplicateNode, moveNode,
    toggleNodeVisibility, toggleNodeLock,
    updateNodeActions,
    setBreakpointVisibility,
    index,
  }
})
