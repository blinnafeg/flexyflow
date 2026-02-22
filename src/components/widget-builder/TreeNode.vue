<script setup lang="ts">
import { ref, computed, inject, nextTick, type Ref } from 'vue'
import type { WidgetNode, WidgetType } from '@/types/widget-builder'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { canHaveChildren } from '@/composables/useWidgetTree'
import {
  Rows3, Columns3, Square, Type, MousePointerClick,
  FormInput, Pilcrow, List, Star,
  ChevronDown, ChevronRight,
  Trash2, ArrowUp, ArrowDown, Copy, Frame,
  Eye, EyeOff, Lock, LockOpen,
  EllipsisVertical, GripVertical, Pencil,
} from 'lucide-vue-next'

import TreeNode from './TreeNode.vue'

const props = defineProps<{
  node: WidgetNode
  depth: number
}>()

const store = useWidgetBuilderStore()

// ── Inject shared state ───────────────────────────────────────────────────────
const collapsed   = inject<Ref<Set<string>>>('collapsed')!
const dragState   = inject<{
  draggedId:    string | null
  dropTargetId: string | null
  dropPosition: 'before' | 'after' | 'inside' | null
}>('dragState')!
const onToggle    = inject<(id: string) => void>('onToggle')!
const searchQuery = inject<Ref<string>>('searchQuery')!

// ── Search filtering ──────────────────────────────────────────────────────────
function subtreeMatches(n: WidgetNode, q: string): boolean {
  if (n.name.toLowerCase().includes(q)) return true
  return n.children.some(c => subtreeMatches(c, q))
}
const isSearchActive   = computed(() => searchQuery.value.trim() !== '')
const isFilteredOut    = computed(() =>
  isSearchActive.value && !subtreeMatches(props.node, searchQuery.value.trim().toLowerCase())
)
const selfMatchesSearch = computed(() =>
  isSearchActive.value && props.node.name.toLowerCase().includes(searchQuery.value.trim().toLowerCase())
)
const showChildren = computed(() => {
  if (!props.node.children.length) return false
  if (isSearchActive.value) return true
  return !collapsed.value.has(props.node.id)
})

// ── State ─────────────────────────────────────────────────────────────────────
const isSelected  = computed(() => store.selectedIds.has(props.node.id))
const hasChildren = computed(() => props.node.children.length > 0)
const isContainer = computed(() => canHaveChildren(props.node.type))
const isRoot      = computed(() => store.widget?.root.id === props.node.id)
const isDragged   = computed(() => dragState.draggedId === props.node.id)
const dropOnThis  = computed(() => dragState.dropTargetId === props.node.id ? dragState.dropPosition : null)
const isHidden    = computed(() => !!props.node.hidden)
const isLocked    = computed(() => !!props.node.locked)

// ── Icon map ──────────────────────────────────────────────────────────────────
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
}

// ── Drag & drop ───────────────────────────────────────────────────────────────
function onDragStart(e: DragEvent) {
  if (isRoot.value || isLocked.value) { e.preventDefault(); return }
  dragState.draggedId = props.node.id
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}
function onDragOver(e: DragEvent) {
  if (!dragState.draggedId || dragState.draggedId === props.node.id) return
  e.preventDefault(); e.stopPropagation()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio = (e.clientY - rect.top) / rect.height
  dragState.dropTargetId = props.node.id
  dragState.dropPosition = isContainer.value
    ? (ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside')
    : (ratio < 0.5  ? 'before' : 'after')
}
function onDragLeave(e: DragEvent) {
  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) {
    if (dragState.dropTargetId === props.node.id) {
      dragState.dropTargetId = null
      dragState.dropPosition = null
    }
  }
}
function onDrop(e: DragEvent) {
  e.preventDefault(); e.stopPropagation()
  if (!dragState.draggedId || !dragState.dropPosition) return
  store.moveNode(dragState.draggedId, props.node.id, dragState.dropPosition)
  dragState.draggedId = dragState.dropTargetId = null
  dragState.dropPosition = null
}
function onDragEnd() {
  dragState.draggedId = dragState.dropTargetId = null
  dragState.dropPosition = null
}

// ── Context menu ──────────────────────────────────────────────────────────────
const menuOpen = ref(false)

const WRAP_TYPES: WidgetType[] = ['Column', 'Row', 'Container']

function menuAction(fn: () => void) {
  fn()
  menuOpen.value = false
}

// ── Inline rename ─────────────────────────────────────────────────────────────
const renaming       = ref(false)
const renameValue    = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

function startRename() {
  menuOpen.value    = false
  renaming.value    = true
  renameValue.value = props.node.name
  nextTick(() => { renameInputRef.value?.focus(); renameInputRef.value?.select() })
}
function commitRename() {
  store.renameNode(props.node.id, renameValue.value.trim() || props.node.name)
  renaming.value = false
}
function onRenameKey(e: KeyboardEvent) {
  if (e.key === 'Enter')  commitRename()
  if (e.key === 'Escape') renaming.value = false
}

// Duplicate helper
function duplicate() {
  const newId = store.duplicateNode(props.node.id)
  if (newId) store.select(newId)
}
</script>

<template>
  <div v-if="!isFilteredOut">
    <!-- ── Row ─────────────────────────────────────────────────────────────── -->
    <div
      class="flex items-center gap-0.5 pr-1 py-[3px] cursor-pointer select-none group relative"
      :class="[
        selfMatchesSearch   ? 'bg-yellow-100/70 dark:bg-yellow-900/30' : '',
        isSelected && !selfMatchesSearch && dropOnThis !== 'inside' ? 'bg-primary/10 text-primary' : '',
        !isSelected && !selfMatchesSearch && dropOnThis !== 'inside' ? 'hover:bg-accent/50' : '',
        dropOnThis === 'inside' ? 'bg-primary/15 ring-1 ring-inset ring-primary rounded' : '',
        isDragged ? 'opacity-30' : '',
        isHidden  ? 'opacity-50' : '',
      ]"
      :style="{ paddingLeft: `${depth * 12 + 4}px` }"
      :draggable="!isRoot && !isLocked"
      @click.stop="($event as MouseEvent).shiftKey ? store.toggleSelectNode(node.id) : store.select(node.id)"
      @dblclick.stop="startRename"
      @dragstart="onDragStart"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @dragend="onDragEnd"
    >
      <!-- Drop indicators -->
      <div v-if="dropOnThis === 'before'" class="absolute top-0 left-2 right-2 h-0.5 bg-primary rounded pointer-events-none z-10" />
      <div v-if="dropOnThis === 'after'"  class="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded pointer-events-none z-10" />

      <!-- Drag handle / Lock indicator -->
      <span
        v-if="!isRoot && !isLocked"
        class="size-4 flex items-center justify-center shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/50 cursor-grab active:cursor-grabbing transition-colors"
      ><GripVertical class="size-3" /></span>
      <span v-else class="size-4 shrink-0" />

      <!-- Chevron -->
      <span
        class="size-4 flex items-center justify-center shrink-0"
        @click.stop="hasChildren && onToggle(node.id)"
      >
        <ChevronDown  v-if="hasChildren && showChildren"  class="size-3 text-muted-foreground" />
        <ChevronRight v-else-if="hasChildren"             class="size-3 text-muted-foreground" />
      </span>

      <!-- Type icon -->
      <component
        :is="ICONS[node.type]"
        class="size-3 shrink-0"
        :class="isHidden ? 'text-muted-foreground/35' : 'text-muted-foreground'"
      />

      <!-- Name / rename input -->
      <input
        v-if="renaming"
        ref="renameInputRef"
        v-model="renameValue"
        class="text-xs flex-1 min-w-0 bg-background border border-primary rounded px-1 h-[18px] outline-none mx-1"
        @blur="commitRename"
        @keydown="onRenameKey"
        @click.stop
      />
      <span
        v-else
        class="text-xs flex-1 truncate mx-1"
        :class="isHidden ? 'text-muted-foreground/45 line-through decoration-1' : ''"
      >{{ node.name }}</span>

      <!-- State badges (persistent when active) -->
      <span
        v-if="isHidden && !isRoot"
        class="shrink-0 text-muted-foreground/50"
        title="Скрыт"
      ><EyeOff class="size-3" /></span>
      <span
        v-if="isLocked && !isRoot"
        class="shrink-0 text-amber-500"
        title="Заблокирован"
      ><Lock class="size-3" /></span>

      <!-- ⋮ context menu trigger (visible on hover, hidden for root rename) -->
      <div v-if="!isRoot && !renaming" class="relative shrink-0">
        <button
          class="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-opacity"
          :class="menuOpen ? 'opacity-100' : ''"
          title="Действия"
          @click.stop="menuOpen = !menuOpen"
        ><EllipsisVertical class="size-3.5" /></button>

        <!-- Overlay -->
        <div v-if="menuOpen" class="fixed inset-0 z-40" @click="menuOpen = false" />

        <!-- Dropdown menu -->
        <div
          v-if="menuOpen"
          class="absolute right-0 top-full mt-0.5 z-50 bg-popover border rounded-lg shadow-lg py-1 w-44"
          @click.stop
        >
          <!-- Rename -->
          <button
            class="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-accent text-left"
            @click="startRename"
          >
            <Pencil class="size-3.5 shrink-0 text-muted-foreground" />
            Переименовать
          </button>

          <div class="h-px bg-border mx-2 my-1" />

          <!-- Visibility -->
          <button
            class="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-accent text-left"
            @click="menuAction(() => store.toggleNodeVisibility(node.id))"
          >
            <EyeOff v-if="!isHidden" class="size-3.5 shrink-0 text-muted-foreground" />
            <Eye    v-else           class="size-3.5 shrink-0 text-muted-foreground" />
            {{ isHidden ? 'Показать' : 'Скрыть' }}
          </button>

          <!-- Lock -->
          <button
            class="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-accent text-left"
            @click="menuAction(() => store.toggleNodeLock(node.id))"
          >
            <LockOpen v-if="isLocked" class="size-3.5 shrink-0 text-muted-foreground" />
            <Lock     v-else          class="size-3.5 shrink-0 text-muted-foreground" />
            {{ isLocked ? 'Разблокировать' : 'Заблокировать' }}
          </button>

          <template v-if="!isLocked">
            <div class="h-px bg-border mx-2 my-1" />

            <!-- Move up -->
            <button
              class="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-accent text-left"
              @click="menuAction(() => store.moveUp(node.id))"
            >
              <ArrowUp class="size-3.5 shrink-0 text-muted-foreground" />
              Вверх
            </button>

            <!-- Move down -->
            <button
              class="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-accent text-left"
              @click="menuAction(() => store.moveDown(node.id))"
            >
              <ArrowDown class="size-3.5 shrink-0 text-muted-foreground" />
              Вниз
            </button>

            <div class="h-px bg-border mx-2 my-1" />

            <!-- Duplicate -->
            <button
              class="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-accent text-left"
              @click="menuAction(duplicate)"
            >
              <Copy class="size-3.5 shrink-0 text-muted-foreground" />
              Дублировать
            </button>

            <!-- Wrap in -->
            <div class="px-3 pt-1.5 pb-0.5">
              <p class="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Обернуть в</p>
              <div class="flex gap-1">
                <button
                  v-for="wt in WRAP_TYPES"
                  :key="wt"
                  class="flex-1 px-1.5 py-1 text-[10px] rounded border hover:bg-accent text-center"
                  @click="menuAction(() => store.wrapIn(node.id, wt))"
                >{{ wt }}</button>
              </div>
            </div>

            <div class="h-px bg-border mx-2 my-1" />

            <!-- Delete -->
            <button
              class="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-accent hover:text-destructive text-left text-destructive/80"
              @click="menuAction(() => store.deleteNode(node.id))"
            >
              <Trash2 class="size-3.5 shrink-0" />
              Удалить
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Children -->
    <div v-if="showChildren">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>
