<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { useProjectsStore } from '@/stores/projects.store'
import { supabase } from '@/lib/supabase'
import type { ListViewConfig, FilterCondition, SortOption, ColumnInfo } from '@/types/list-view'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, RefreshCw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const store = useWidgetBuilderStore()
const projectsStore = useProjectsStore()

const node = computed(() => store.selectedNode)

// Data service for the current project (uses project's Supabase credentials)
const dataService = computed(() =>
  projectsStore.getDataService(store.widget?.projectId ?? '')
)

// Shortcut to read listViewConfig with defaults
const cfg = computed((): ListViewConfig => node.value?.props.listViewConfig ?? {
  dataSource: { type: 'table', source: '' },
  filters: [],
  sorting: [],
  pagination: { enabled: false, pageSize: 10 },
  listItemWidgetId: '',
})

function patchCfg(patch: Partial<ListViewConfig>) {
  if (!node.value) return
  store.updateProps(node.value.id, {
    listViewConfig: { ...cfg.value, ...patch },
  })
}

// ── Table list from project's DB ───────────────────────────────────────────
const availableTables = ref<string[]>([])
const tablesLoading   = ref(false)

async function loadAvailableTables() {
  tablesLoading.value = true
  try {
    availableTables.value = await dataService.value.getTables()
  } catch {
    availableTables.value = []
  } finally {
    tablesLoading.value = false
  }
}

// ── Column introspection ───────────────────────────────────────────────────
const columns = ref<ColumnInfo[]>([])
const loadingCols = ref(false)

async function loadColumns() {
  const src = cfg.value.dataSource.source.trim()
  if (!src) return
  loadingCols.value = true
  try {
    columns.value = await dataService.value.getColumns(src)
    toast.success(`Загружено ${columns.value.length} полей`)
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    loadingCols.value = false
  }
}

// ── ListItem widget selector ───────────────────────────────────────────────
const availableWidgets = ref<{ id: string; name: string }[]>([])

async function loadWidgets() {
  const projectId = store.widget?.projectId
  if (!projectId) return
  const { data } = await supabase
    .from('ff_widgets')
    .select('id, name')
    .eq('project_id', projectId)
    .neq('id', store.widget!.id) // exclude self
  availableWidgets.value = data ?? []
}

onMounted(() => {
  loadWidgets()
  loadAvailableTables()
})

// ── Filters ───────────────────────────────────────────────────────────────
function addFilter() {
  patchCfg({ filters: [...cfg.value.filters, { field: '', operator: 'eq', value: '' }] })
}

function removeFilter(i: number) {
  const filters = cfg.value.filters.filter((_, idx) => idx !== i)
  patchCfg({ filters })
}

function updateFilter(i: number, patch: Partial<FilterCondition>) {
  const filters = cfg.value.filters.map((f, idx) => idx === i ? { ...f, ...patch } : f)
  patchCfg({ filters })
}

// ── Sorting ───────────────────────────────────────────────────────────────
function addSort() {
  patchCfg({ sorting: [...cfg.value.sorting, { field: '', order: 'asc' }] })
}

function removeSort(i: number) {
  const sorting = cfg.value.sorting.filter((_, idx) => idx !== i)
  patchCfg({ sorting })
}

function updateSort(i: number, patch: Partial<SortOption>) {
  const sorting = cfg.value.sorting.map((s, idx) => idx === i ? { ...s, ...patch } : s)
  patchCfg({ sorting })
}

const OPERATORS: { value: FilterCondition['operator']; label: string }[] = [
  { value: 'eq',   label: '= равно' },
  { value: 'neq',  label: '≠ не равно' },
  { value: 'gt',   label: '> больше' },
  { value: 'gte',  label: '≥' },
  { value: 'lt',   label: '< меньше' },
  { value: 'lte',  label: '≤' },
  { value: 'like', label: '~ содержит' },
]

const fieldOptions = computed(() =>
  columns.value.length > 0 ? columns.value : []
)
</script>

<template>
  <div class="flex-1 overflow-y-auto p-3 space-y-4">

    <!-- Data source -->
    <div class="space-y-2">
      <Label class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
        Источник данных
      </Label>

      <!-- Dropdown if tables available from connected DB -->
      <template v-if="availableTables.length > 0">
        <Select
          :model-value="cfg.dataSource.source || '__none__'"
          @update:model-value="patchCfg({ dataSource: { ...cfg.dataSource, source: $event === '__none__' ? '' : $event } })"
        >
          <SelectTrigger class="h-7 text-xs">
            <SelectValue placeholder="Выберите таблицу..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Выберите таблицу —</SelectItem>
            <SelectItem v-for="t in availableTables" :key="t" :value="t">
              {{ t }}
            </SelectItem>
          </SelectContent>
        </Select>
      </template>

      <!-- Fallback: text input (no DB connected or loading) -->
      <template v-else>
        <Input
          placeholder="Имя таблицы..."
          class="h-7 text-xs"
          :disabled="tablesLoading"
          :model-value="cfg.dataSource.source"
          @update:model-value="patchCfg({ dataSource: { ...cfg.dataSource, source: $event } })"
        />
        <p v-if="!tablesLoading" class="text-[11px] text-muted-foreground">
          Подключите базу данных в настройках проекта для выбора таблицы из списка.
        </p>
      </template>

      <Button
        variant="outline" size="sm" class="h-7 w-full text-xs"
        :disabled="loadingCols || !cfg.dataSource.source.trim()"
        @click="loadColumns"
      >
        <RefreshCw class="size-3 mr-1.5" :class="loadingCols ? 'animate-spin' : ''" />
        Загрузить поля таблицы
      </Button>
      <div v-if="columns.length > 0" class="flex flex-wrap gap-1">
        <Badge
          v-for="col in columns"
          :key="col.name"
          variant="secondary"
          class="text-[10px] font-mono"
        >
          {{ col.name }}
          <span class="text-muted-foreground ml-1">{{ col.type }}</span>
        </Badge>
      </div>
    </div>

    <Separator />

    <!-- ListItem widget -->
    <div class="space-y-2">
      <Label class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
        Шаблон элемента
      </Label>
      <Select
        :model-value="cfg.listItemWidgetId || '__none__'"
        @update:model-value="patchCfg({ listItemWidgetId: $event === '__none__' ? '' : $event })"
      >
        <SelectTrigger class="h-7 text-xs">
          <SelectValue placeholder="Выберите виджет-шаблон..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— Не выбрано —</SelectItem>
          <SelectItem v-for="w in availableWidgets" :key="w.id" :value="w.id">
            {{ w.name }}
          </SelectItem>
        </SelectContent>
      </Select>
      <p class="text-[10px] text-muted-foreground leading-relaxed">
        Виджет должен быть помечен как «Шаблон списка» и иметь настроенные привязки данных.
      </p>
    </div>

    <Separator />

    <!-- Filters -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <Label class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
          Фильтры
        </Label>
        <Button variant="ghost" size="icon-sm" title="Добавить фильтр" @click="addFilter">
          <Plus class="size-3" />
        </Button>
      </div>

      <div
        v-for="(filter, i) in cfg.filters"
        :key="i"
        class="space-y-1.5 p-2 bg-muted/60 rounded-md border border-border/50"
      >
        <div class="flex gap-1 items-center">
          <!-- Field: typeahead from loaded columns or free text -->
          <Input
            placeholder="Поле"
            class="h-6 text-[11px] flex-1 font-mono"
            :model-value="filter.field"
            :list="`cols-filter-${i}`"
            @update:model-value="updateFilter(i, { field: $event })"
          />
          <datalist :id="`cols-filter-${i}`">
            <option v-for="col in fieldOptions" :key="col.name" :value="col.name" />
          </datalist>
          <Button variant="ghost" size="icon-sm" @click="removeFilter(i)">
            <Trash2 class="size-3 text-destructive" />
          </Button>
        </div>

        <Select
          :model-value="filter.operator"
          @update:model-value="updateFilter(i, { operator: $event as FilterCondition['operator'] })"
        >
          <SelectTrigger class="h-6 text-[11px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="op in OPERATORS" :key="op.value" :value="op.value">
              {{ op.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Значение"
          class="h-6 text-[11px]"
          :model-value="filter.value"
          @update:model-value="updateFilter(i, { value: $event })"
        />
      </div>

      <p v-if="cfg.filters.length === 0" class="text-[11px] text-muted-foreground">
        Нет фильтров — загружаются все записи
      </p>
    </div>

    <Separator />

    <!-- Sorting -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <Label class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
          Сортировка
        </Label>
        <Button variant="ghost" size="icon-sm" title="Добавить сортировку" @click="addSort">
          <Plus class="size-3" />
        </Button>
      </div>

      <div v-for="(sort, i) in cfg.sorting" :key="i" class="flex gap-1 items-center">
        <Input
          placeholder="Поле"
          class="h-6 text-[11px] flex-1 font-mono"
          :model-value="sort.field"
          :list="`cols-sort-${i}`"
          @update:model-value="updateSort(i, { field: $event })"
        />
        <datalist :id="`cols-sort-${i}`">
          <option v-for="col in fieldOptions" :key="col.name" :value="col.name" />
        </datalist>
        <Select
          :model-value="sort.order"
          @update:model-value="updateSort(i, { order: $event as 'asc' | 'desc' })"
        >
          <SelectTrigger class="h-6 text-[11px] w-16 shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">А→Я</SelectItem>
            <SelectItem value="desc">Я→А</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon-sm" @click="removeSort(i)">
          <Trash2 class="size-3 text-destructive" />
        </Button>
      </div>

      <p v-if="cfg.sorting.length === 0" class="text-[11px] text-muted-foreground">
        Нет сортировки
      </p>
    </div>

    <Separator />

    <!-- Pagination -->
    <div class="space-y-2">
      <Label class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
        Пагинация
      </Label>
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          :checked="cfg.pagination.enabled"
          class="rounded"
          @change="patchCfg({ pagination: { ...cfg.pagination, enabled: ($event.target as HTMLInputElement).checked } })"
        />
        <span class="text-xs">Включить пагинацию</span>
      </label>
      <div v-if="cfg.pagination.enabled" class="flex items-center gap-2">
        <Label class="text-[11px] text-muted-foreground shrink-0">Записей на страницу:</Label>
        <Input
          type="number"
          class="h-6 text-[11px] w-16"
          min="1"
          max="500"
          :model-value="cfg.pagination.pageSize"
          @update:model-value="patchCfg({ pagination: { ...cfg.pagination, pageSize: Number($event) || 10 } })"
        />
      </div>
    </div>

  </div>
</template>
