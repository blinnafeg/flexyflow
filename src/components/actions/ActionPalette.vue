<script setup lang="ts">
import { computed } from 'vue'
import type { ActionDefinition, ActionType } from '@/types'
import { BUILT_IN_ACTIONS, ACTIONS_BY_CATEGORY } from '@/registry/actions.registry'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Eye, EyeOff, ToggleLeft, Navigation, ArrowLeft,
  Download, Plus, Pencil, Trash2, Variable, Eraser,
  Bell, Square, ChevronsDown, Code2,
} from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'select', type: ActionType): void
}>()

const iconMap: Record<string, unknown> = {
  Eye, EyeOff, ToggleLeft, Navigation, ArrowLeft,
  Download, Plus, Pencil, Trash2, Variable, Eraser,
  Bell, Square, ChevronsDown, Code2,
}

const categoryLabels: Record<string, string> = {
  visibility: 'Видимость',
  navigation: 'Навигация',
  data: 'Данные',
  state: 'Состояние',
  ui: 'Интерфейс',
  custom: 'Кастомные',
}

const categoryOrder = ['visibility', 'navigation', 'data', 'state', 'ui', 'custom']

const grouped = computed(() =>
  categoryOrder
    .filter(cat => ACTIONS_BY_CATEGORY[cat]?.length)
    .map(cat => ({
      key: cat,
      label: categoryLabels[cat] ?? cat,
      actions: ACTIONS_BY_CATEGORY[cat],
    }))
)

function select(type: ActionType) {
  emit('select', type)
  emit('update:open', false)
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="right" class="w-80 flex flex-col gap-0 p-0">
      <SheetHeader class="px-4 pt-5 pb-3 border-b">
        <SheetTitle>Добавить действие</SheetTitle>
        <SheetDescription>Выберите тип действия для шага</SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto py-2">
        <div v-for="group in grouped" :key="group.key" class="mb-1">
          <p class="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {{ group.label }}
          </p>
          <button
            v-for="action in group.actions"
            :key="action.type"
            class="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-accent text-left transition-colors"
            @click="select(action.type)"
          >
            <component
              :is="iconMap[action.icon]"
              class="size-4 text-muted-foreground mt-0.5 shrink-0"
            />
            <div>
              <p class="text-sm font-medium leading-tight">{{ action.label }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ action.description }}</p>
            </div>
          </button>
          <Separator class="mt-1" />
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
