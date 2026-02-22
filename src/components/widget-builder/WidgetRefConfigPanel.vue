<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GripVertical, X, AlignHorizontalJustifyStart, AlignVerticalJustifyStart } from 'lucide-vue-next'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode)

// ── Available project widgets ────────────────────────────────────────────────
const allWidgets = ref<{ id: string; name: string }[]>([])
const loading = ref(false)

onMounted(async () => {
  if (!store.widget?.projectId) return
  loading.value = true
  try {
    const { data } = await supabase
      .from('ff_widgets')
      .select('id, name')
      .eq('project_id', store.widget.projectId)
      .order('name')
    allWidgets.value = (data ?? []).filter(w => w.id !== store.widget?.id)
  } finally {
    loading.value = false
  }
})

// ── Slot items (backward compat with legacy widgetRefId) ─────────────────────
const effectiveItems = computed<{ id: string; name: string }[]>(() => {
  if (!node.value) return []
  if (node.value.props.widgetRefIds?.length) return node.value.props.widgetRefIds
  if (node.value.props.widgetRefId)
    return [{ id: node.value.props.widgetRefId, name: node.value.name }]
  return []
})

// ── Orientation ───────────────────────────────────────────────────────────────
const orientation = computed(() => node.value?.props.slotOrientation ?? 'column')

function setOrientation(dir: 'row' | 'column') {
  if (!node.value) return
  store.updateProps(node.value.id, { slotOrientation: dir })
}

// ── Add widget ────────────────────────────────────────────────────────────────
const selectedToAdd = ref('')

const availableToAdd = computed(() =>
  allWidgets.value.filter(w => !effectiveItems.value.some(e => e.id === w.id))
)

function addWidget() {
  if (!node.value || !selectedToAdd.value) return
  const w = allWidgets.value.find(x => x.id === selectedToAdd.value)
  if (!w) return
  store.updateSlotItems(node.value.id, [...effectiveItems.value, { id: w.id, name: w.name }])
  selectedToAdd.value = ''
}

// ── Remove ────────────────────────────────────────────────────────────────────
function removeItem(idx: number) {
  if (!node.value) return
  const items = effectiveItems.value.filter((_, i) => i !== idx)
  store.updateSlotItems(node.value.id, items)
}

// ── Drag-and-drop reorder ─────────────────────────────────────────────────────
const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)

function onDragStart(i: number) {
  dragIndex.value = i
}

function onDragOver(e: DragEvent, i: number) {
  e.preventDefault()
  dropIndex.value = i
}

function onDrop() {
  if (!node.value || dragIndex.value === null || dropIndex.value === null) return
  if (dragIndex.value === dropIndex.value) {
    dragIndex.value = null
    dropIndex.value = null
    return
  }
  const items = [...effectiveItems.value]
  const [moved] = items.splice(dragIndex.value, 1)
  items.splice(dropIndex.value, 0, moved)
  store.updateSlotItems(node.value.id, items)
  dragIndex.value = null
  dropIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dropIndex.value = null
}
</script>

<template>
  <div class="p-3 space-y-3 overflow-y-auto flex-1">
    <!-- Header -->
    <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Слот</p>

    <!-- Orientation picker -->
    <div class="space-y-1.5">
      <p class="text-[11px] text-muted-foreground">Ориентация</p>
      <div class="flex gap-1.5">
        <Button
          size="sm"
          :variant="orientation === 'row' ? 'default' : 'outline'"
          class="flex-1 h-7 text-xs gap-1.5"
          @click="setOrientation('row')"
        >
          <AlignHorizontalJustifyStart class="size-3" />
          Строка
        </Button>
        <Button
          size="sm"
          :variant="orientation === 'column' ? 'default' : 'outline'"
          class="flex-1 h-7 text-xs gap-1.5"
          @click="setOrientation('column')"
        >
          <AlignVerticalJustifyStart class="size-3" />
          Колонка
        </Button>
      </div>
    </div>

    <Separator />

    <!-- Slot items list -->
    <div class="space-y-1.5">
      <p class="text-[11px] text-muted-foreground flex items-center gap-1.5">
        Виджеты в слоте
        <Badge v-if="effectiveItems.length" variant="secondary" class="text-[10px] px-1.5 py-0">
          {{ effectiveItems.length }}
        </Badge>
      </p>

      <div v-if="loading" class="text-xs text-muted-foreground animate-pulse py-1">Загрузка...</div>

      <template v-else>
        <p v-if="effectiveItems.length === 0" class="text-[11px] text-muted-foreground/60 italic py-1">
          Нет виджетов
        </p>

        <div v-else class="rounded-md border divide-y overflow-hidden">
          <div
            v-for="(item, i) in effectiveItems"
            :key="item.id"
            draggable="true"
            class="flex items-center gap-1.5 px-2 py-1.5 bg-background transition-colors select-none cursor-grab active:cursor-grabbing"
            :class="{
              'bg-accent': dropIndex === i && dragIndex !== i,
              'opacity-40': dragIndex === i,
            }"
            @dragstart="onDragStart(i)"
            @dragover="onDragOver($event, i)"
            @drop="onDrop"
            @dragend="onDragEnd"
          >
            <GripVertical class="size-3 text-muted-foreground/50 shrink-0" />
            <span class="flex-1 text-xs truncate">{{ item.name }}</span>
            <button
              class="p-0.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground/50 transition-colors"
              @click.stop="removeItem(i)"
            >
              <X class="size-3" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <Separator />

    <!-- Add widget -->
    <div class="space-y-1.5">
      <p class="text-[11px] text-muted-foreground">Добавить виджет</p>
      <Select v-model="selectedToAdd">
        <SelectTrigger class="h-7 text-xs">
          <SelectValue placeholder="— выбрать виджет —" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="w in availableToAdd"
            :key="w.id"
            :value="w.id"
            class="text-xs"
          >
            {{ w.name }}
          </SelectItem>
          <div
            v-if="availableToAdd.length === 0"
            class="px-2 py-3 text-center text-xs text-muted-foreground/60 italic"
          >
            Нет доступных виджетов
          </div>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        class="w-full h-7 text-xs"
        :disabled="!selectedToAdd"
        @click="addWidget"
      >
        + Добавить
      </Button>
    </div>
  </div>
</template>
