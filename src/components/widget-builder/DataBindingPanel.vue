<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { DataSourceService } from '@/services/DataSourceService'
import type { ColumnInfo, DataBindingProperty } from '@/types/list-view'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Unlink } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const store = useWidgetBuilderStore()
const dataService = new DataSourceService()

const node = computed(() => store.selectedNode)
const meta = computed(() => store.listItemMeta)

// Columns of the configured data source
const columns = ref<ColumnInfo[]>([])
const loadingCols = ref(false)

async function loadColumns() {
  const src = meta.value.dataSource.source.trim()
  if (!src) return
  loadingCols.value = true
  try {
    columns.value = await dataService.getColumns(src)
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    loadingCols.value = false
  }
}

// Auto-load when source changes
watch(() => meta.value.dataSource.source, loadColumns, { immediate: true })

// Properties that can be bound for the selected node type
const BINDABLE: Record<string, { property: DataBindingProperty; label: string }[]> = {
  Text:      [{ property: 'text',        label: 'Текст' }],
  Button:    [{ property: 'text',        label: 'Подпись' }],
  TextField: [{ property: 'text',        label: 'Значение' },
              { property: 'placeholder', label: 'Placeholder' }],
}

const bindableProps = computed(() => {
  const type = node.value?.type ?? ''
  return BINDABLE[type] ?? []
})

function getBinding(property: DataBindingProperty): string {
  if (!node.value) return '__none__'
  return meta.value.dataBindings.find(
    b => b.nodeId === node.value!.id && b.property === property,
  )?.field ?? '__none__'
}

function setBinding(property: DataBindingProperty, field: string) {
  if (!node.value) return
  store.setDataBinding(node.value.id, property, field === '__none__' ? '' : field)
}

// Summary of all bindings across the whole widget
const allBindings = computed(() => meta.value.dataBindings)
</script>

<template>
  <div class="space-y-4 p-3">

    <!-- Source info -->
    <div class="flex items-start justify-between gap-2">
      <div class="space-y-1 min-w-0">
        <p class="text-[11px] text-muted-foreground">Источник данных</p>
        <Badge v-if="meta.dataSource.source" variant="outline" class="text-[10px] font-mono truncate max-w-full">
          {{ meta.dataSource.source }}
        </Badge>
        <p v-else class="text-[11px] text-destructive">
          Источник не задан — укажи таблицу в блоке «Данные» на левой панели
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        title="Перезагрузить поля"
        :disabled="loadingCols || !meta.dataSource.source"
        @click="loadColumns"
      >
        <RefreshCw class="size-3" :class="loadingCols ? 'animate-spin' : ''" />
      </Button>
    </div>

    <!-- Binding for selected node -->
    <template v-if="node && bindableProps.length > 0">
      <div class="space-y-2">
        <Label class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
          Привязка «{{ node.name }}»
        </Label>
        <div v-for="{ property, label } in bindableProps" :key="property" class="space-y-1">
          <p class="text-[11px] text-muted-foreground">{{ label }}</p>
          <Select :model-value="getBinding(property)" @update:model-value="setBinding(property, $event)">
            <SelectTrigger class="h-7 text-xs">
              <SelectValue placeholder="— не привязано —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— не привязано —</SelectItem>
              <SelectItem v-for="col in columns" :key="col.name" :value="col.name">
                <span class="font-mono">{{ col.name }}</span>
                <span class="text-muted-foreground text-[10px] ml-1">{{ col.type }}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </template>

    <p v-else-if="node" class="text-[11px] text-muted-foreground">
      Выберите элемент Text, Button или TextField для привязки к данным.
    </p>

    <!-- All bindings summary -->
    <template v-if="allBindings.length > 0">
      <div class="border-t pt-3 space-y-1.5">
        <p class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
          Все привязки
        </p>
        <div
          v-for="b in allBindings"
          :key="`${b.nodeId}-${b.property}`"
          class="flex items-center gap-2 text-[11px] group"
        >
          <span class="text-muted-foreground shrink-0">{{ b.property }}</span>
          <span class="flex-1 font-mono truncate">{{ b.field }}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            class="opacity-0 group-hover:opacity-100 shrink-0"
            @click="store.removeDataBinding(b.nodeId, b.property)"
          >
            <Unlink class="size-3 text-destructive" />
          </Button>
        </div>
      </div>
    </template>

  </div>
</template>
