<script setup lang="ts">
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { GridSlot } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Minus, Trash2, Merge } from 'lucide-vue-next'

const props = defineProps<{
  gridCols: number
  gridRows: number
  colWidths: string[]
  rowHeights: string[]
  gap: string
  slots: GridSlot[]
}>()

const emit = defineEmits<{
  (e: 'update:gridCols', v: number): void
  (e: 'update:gridRows', v: number): void
  (e: 'update:colWidths', v: string[]): void
  (e: 'update:rowHeights', v: string[]): void
  (e: 'update:gap', v: string): void
  (e: 'update:slots', v: GridSlot[]): void
}>()

// Local state
const selectedSlotId = ref<string | null>(null)
const selectedCells = ref<Set<string>>(new Set()) // "r,c" keys

// Derived
const occupancy = computed(() => {
  const map: Record<string, string> = {}
  for (const slot of props.slots) {
    for (let r = slot.row; r < slot.row + slot.rowSpan; r++) {
      for (let c = slot.col; c < slot.col + slot.colSpan; c++) {
        map[`${r},${c}`] = slot.id
      }
    }
  }
  return map
})

const selectedSlot = computed(() =>
  props.slots.find(s => s.id === selectedSlotId.value) ?? null
)

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: props.colWidths.join(' '),
  gridTemplateRows: props.rowHeights.join(' '),
  gap: props.gap,
}))

const colHeaderStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: props.colWidths.join(' '),
  gap: props.gap,
}))

// Cells for rendering
interface Cell {
  row: number
  col: number
  key: string
  slotId: string | null
  slot: GridSlot | null
  isTopLeft: boolean
  cssStyle: Record<string, string>
  selected: boolean
}

const renderCells = computed((): Cell[] => {
  const cells: Cell[] = []
  const rendered = new Set<string>()

  for (let r = 1; r <= props.gridRows; r++) {
    for (let c = 1; c <= props.gridCols; c++) {
      const key = `${r},${c}`
      if (rendered.has(key)) continue

      const slotId = occupancy.value[key] ?? null
      const slot = slotId ? (props.slots.find(s => s.id === slotId) ?? null) : null

      if (slot && slot.row === r && slot.col === c) {
        // Mark all cells of this slot as rendered
        for (let dr = 0; dr < slot.rowSpan; dr++) {
          for (let dc = 0; dc < slot.colSpan; dc++) {
            rendered.add(`${r + dr},${c + dc}`)
          }
        }
        cells.push({
          row: r, col: c, key,
          slotId, slot, isTopLeft: true,
          cssStyle: {
            gridColumn: `${c} / ${c + slot.colSpan}`,
            gridRow: `${r} / ${r + slot.rowSpan}`,
          },
          selected: selectedSlotId.value === slot.id,
        })
      } else if (!slotId) {
        rendered.add(key)
        cells.push({
          row: r, col: c, key,
          slotId: null, slot: null, isTopLeft: false,
          cssStyle: {
            gridColumn: `${c} / ${c + 1}`,
            gridRow: `${r} / ${r + 1}`,
          },
          selected: selectedCells.value.has(key),
        })
      }
    }
  }
  return cells
})

// Resizing helpers
function adjustCols(delta: number) {
  const next = Math.max(1, props.gridCols + delta)
  emit('update:gridCols', next)
  const widths = [...props.colWidths]
  while (widths.length < next) widths.push('1fr')
  emit('update:colWidths', widths.slice(0, next))
  // Clamp slots
  const clampedSlots = props.slots
    .map(s => ({ ...s, colSpan: Math.min(s.colSpan, next - s.col + 1) }))
    .filter(s => s.col <= next)
  emit('update:slots', clampedSlots)
}

function adjustRows(delta: number) {
  const next = Math.max(1, props.gridRows + delta)
  emit('update:gridRows', next)
  const heights = [...props.rowHeights]
  while (heights.length < next) heights.push('auto')
  emit('update:rowHeights', heights.slice(0, next))
  const clampedSlots = props.slots
    .map(s => ({ ...s, rowSpan: Math.min(s.rowSpan, next - s.row + 1) }))
    .filter(s => s.row <= next)
  emit('update:slots', clampedSlots)
}

// Cell interaction
function clickEmpty(r: number, c: number) {
  const key = `${r},${c}`
  if (selectedCells.value.has(key)) {
    selectedCells.value.delete(key)
  } else {
    selectedCells.value.add(key)
  }
  selectedSlotId.value = null
}

function dblClickEmpty(r: number, c: number) {
  const slot: GridSlot = {
    id: nanoid(8),
    name: `slot-${r}-${c}`,
    label: `Слот ${r}×${c}`,
    row: r, col: c, rowSpan: 1, colSpan: 1,
  }
  emit('update:slots', [...props.slots, slot])
  selectedSlotId.value = slot.id
  selectedCells.value.clear()
}

function clickSlot(id: string) {
  selectedSlotId.value = id === selectedSlotId.value ? null : id
  selectedCells.value.clear()
}

function createSlotFromSelection() {
  if (selectedCells.value.size === 0) return
  const coords = [...selectedCells.value].map(k => k.split(',').map(Number))
  const rows = coords.map(c => c[0])
  const cols = coords.map(c => c[1])
  const minR = Math.min(...rows), maxR = Math.max(...rows)
  const minC = Math.min(...cols), maxC = Math.max(...cols)
  // Validate rectangle
  const expected = (maxR - minR + 1) * (maxC - minC + 1)
  if (selectedCells.value.size !== expected) {
    alert('Выберите прямоугольный диапазон ячеек')
    return
  }
  const slot: GridSlot = {
    id: nanoid(8),
    name: `slot-${minR}-${minC}`,
    label: `Слот ${minR}×${minC}`,
    row: minR, col: minC,
    rowSpan: maxR - minR + 1,
    colSpan: maxC - minC + 1,
  }
  emit('update:slots', [...props.slots, slot])
  selectedSlotId.value = slot.id
  selectedCells.value.clear()
}

function updateSlotField(field: keyof GridSlot, value: string | number) {
  if (!selectedSlot.value) return
  const updated = props.slots.map(s =>
    s.id === selectedSlot.value!.id ? { ...s, [field]: value } : s
  )
  emit('update:slots', updated)
}

function deleteSelectedSlot() {
  emit('update:slots', props.slots.filter(s => s.id !== selectedSlotId.value))
  selectedSlotId.value = null
}

function updateColWidth(idx: number, val: string) {
  const widths = [...props.colWidths]
  widths[idx] = val || '1fr'
  emit('update:colWidths', widths)
}

function updateRowHeight(idx: number, val: string) {
  const heights = [...props.rowHeights]
  heights[idx] = val || 'auto'
  emit('update:rowHeights', heights)
}

</script>

<template>
  <div class="flex gap-4 h-full">
    <!-- Left panel: grid controls + canvas -->
    <div class="flex-1 flex flex-col gap-3 min-w-0">
      <!-- Grid dimension controls -->
      <div class="flex items-center gap-6 flex-wrap">
        <div class="flex items-center gap-2">
          <Label class="text-xs text-muted-foreground">Колонки</Label>
          <Button variant="outline" size="icon-sm" @click="adjustCols(-1)"><Minus class="size-3" /></Button>
          <span class="w-6 text-center text-sm font-medium">{{ gridCols }}</span>
          <Button variant="outline" size="icon-sm" @click="adjustCols(1)"><Plus class="size-3" /></Button>
        </div>
        <div class="flex items-center gap-2">
          <Label class="text-xs text-muted-foreground">Строки</Label>
          <Button variant="outline" size="icon-sm" @click="adjustRows(-1)"><Minus class="size-3" /></Button>
          <span class="w-6 text-center text-sm font-medium">{{ gridRows }}</span>
          <Button variant="outline" size="icon-sm" @click="adjustRows(1)"><Plus class="size-3" /></Button>
        </div>
        <div class="flex items-center gap-2">
          <Label class="text-xs text-muted-foreground">Gap</Label>
          <Input
            :model-value="gap"
            class="h-7 w-20 text-xs"
            @update:model-value="emit('update:gap', String($event))"
          />
        </div>
        <Button
          v-if="selectedCells.size > 0"
          variant="secondary"
          size="sm"
          @click="createSlotFromSelection"
        >
          <Merge class="size-4 mr-1" />
          Создать слот ({{ selectedCells.size }} ячеек)
        </Button>
      </div>

      <!-- Column width inputs (aligned with grid) -->
      <div :style="colHeaderStyle" class="gap-1">
        <div v-for="(w, i) in colWidths" :key="i" class="flex justify-center">
          <Input
            :model-value="w"
            class="h-6 text-xs text-center px-1"
            @update:model-value="updateColWidth(i, String($event))"
          />
        </div>
      </div>

      <!-- Grid canvas -->
      <div
        class="border border-border rounded-lg overflow-hidden bg-muted/20 min-h-[300px]"
        :style="gridStyle"
      >
        <div
          v-for="cell in renderCells"
          :key="cell.key"
          :style="cell.cssStyle"
          class="border border-dashed border-border/60 min-h-[60px] relative transition-colors"
          :class="{
            'bg-primary/10 border-primary': cell.slot && cell.selected,
            'bg-accent/60 border-accent-foreground/30': cell.slot && !cell.selected,
            'bg-blue-50 dark:bg-blue-950/30 border-blue-400': !cell.slot && cell.selected,
            'cursor-pointer': true,
          }"
          @click="cell.slot ? clickSlot(cell.slot.id) : clickEmpty(cell.row, cell.col)"
          @dblclick="!cell.slot && dblClickEmpty(cell.row, cell.col)"
        >
          <!-- Slot label -->
          <template v-if="cell.slot && cell.isTopLeft">
            <div class="absolute inset-0 flex flex-col items-center justify-center p-2">
              <Badge variant="secondary" class="text-xs mb-0.5">{{ cell.slot.label || cell.slot.name }}</Badge>
              <p class="text-xs text-muted-foreground">{{ cell.slot.name }}</p>
            </div>
          </template>
          <!-- Empty cell hint -->
          <template v-else-if="!cell.slot">
            <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <p class="text-xs text-muted-foreground">2×клик = слот</p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Right panel: slot properties or row heights -->
    <div class="w-56 flex flex-col gap-3 shrink-0">
      <template v-if="selectedSlot">
        <p class="text-sm font-semibold">Свойства слота</p>
        <Separator />
        <div class="space-y-2">
          <div>
            <Label class="text-xs">Метка (label)</Label>
            <Input
              :model-value="selectedSlot.label"
              class="h-8 text-sm mt-0.5"
              @update:model-value="updateSlotField('label', $event)"
            />
          </div>
          <div>
            <Label class="text-xs">Имя/ID (name)</Label>
            <Input
              :model-value="selectedSlot.name"
              class="h-8 text-sm mt-0.5"
              @update:model-value="updateSlotField('name', $event)"
            />
          </div>
          <div class="grid grid-cols-2 gap-1">
            <div>
              <Label class="text-xs">Строка</Label>
              <Input :model-value="selectedSlot.row" type="number" min="1" class="h-8 text-sm mt-0.5" @update:model-value="updateSlotField('row', Number($event))" />
            </div>
            <div>
              <Label class="text-xs">Колонка</Label>
              <Input :model-value="selectedSlot.col" type="number" min="1" class="h-8 text-sm mt-0.5" @update:model-value="updateSlotField('col', Number($event))" />
            </div>
            <div>
              <Label class="text-xs">rowSpan</Label>
              <Input :model-value="selectedSlot.rowSpan" type="number" min="1" class="h-8 text-sm mt-0.5" @update:model-value="updateSlotField('rowSpan', Number($event))" />
            </div>
            <div>
              <Label class="text-xs">colSpan</Label>
              <Input :model-value="selectedSlot.colSpan" type="number" min="1" class="h-8 text-sm mt-0.5" @update:model-value="updateSlotField('colSpan', Number($event))" />
            </div>
          </div>
        </div>
        <Button variant="destructive" size="sm" @click="deleteSelectedSlot">
          <Trash2 class="size-4 mr-1" />
          Удалить слот
        </Button>
      </template>

      <template v-else>
        <p class="text-sm font-semibold">Высоты строк</p>
        <Separator />
        <div class="space-y-1.5">
          <div v-for="(h, i) in rowHeights" :key="i" class="flex items-center gap-2">
            <Label class="text-xs text-muted-foreground w-6 shrink-0">{{ i + 1 }}</Label>
            <Input
              :model-value="h"
              class="h-7 text-xs"
              @update:model-value="updateRowHeight(i, String($event))"
            />
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-2">
          Дважды кликните на пустую ячейку для создания слота. Выберите несколько ячеек для объединения.
        </p>
      </template>
    </div>
  </div>
</template>
