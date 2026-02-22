<script setup lang="ts">
import { computed } from 'vue'
import { Layers } from 'lucide-vue-next'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import PropertySection     from './PropertySection.vue'
import SizeSection         from './properties/SizeSection.vue'
import SpacingSection      from './properties/SpacingSection.vue'
import BorderSection       from './properties/BorderSection.vue'
import ColorsSection       from './properties/ColorsSection.vue'
import TypographySection   from './properties/TypographySection.vue'
import FlexSection         from './properties/FlexSection.vue'
import ContentSection      from './properties/ContentSection.vue'
import ListViewConfigPanel  from './ListViewConfigPanel.vue'
import DataBindingPanel    from './DataBindingPanel.vue'
import NodeActionsPanel    from './NodeActionsPanel.vue'
import WidgetRefConfigPanel from './WidgetRefConfigPanel.vue'
import ResponsiveSection   from './properties/ResponsiveSection.vue'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode)

const isListViewNode  = computed(() => node.value?.type === 'ListView')
const isWidgetRefNode = computed(() => node.value?.type === 'WidgetRef')

const isFlexContainer = computed(() => {
  if (store.isMultiSelect)
    return store.selectedNodes.every(n => ['Column', 'Row', 'Container'].includes(n.type))
  return node.value ? ['Column', 'Row', 'Container'].includes(node.value.type) : false
})

const hasTypography = computed(() => {
  if (store.isMultiSelect)
    return store.selectedNodes.every(n => ['Text', 'Button', 'TextField', 'RichText'].includes(n.type))
  return node.value ? ['Text', 'Button', 'TextField', 'RichText'].includes(node.value.type) : false
})

const hasContent = computed(() =>
  !store.isMultiSelect &&
  node.value !== null &&
  ['Text', 'Button', 'TextField', 'RichText', 'Icon'].includes(node.value?.type ?? '')
)

const showDataSection = computed(() =>
  !store.isMultiSelect &&
  store.widgetKind === 'list-item' &&
  node.value !== null &&
  ['Text', 'Button', 'TextField'].includes(node.value?.type ?? '')
)
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Empty state -->
    <div v-if="!node" class="flex-1 flex items-center justify-center">
      <p class="text-sm text-muted-foreground">Выберите элемент</p>
    </div>

    <template v-else>
      <!-- Multi-select banner -->
      <div
        v-if="store.isMultiSelect"
        class="px-3 py-2 bg-blue-500/10 border-b text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 shrink-0"
      >
        <Layers class="size-3.5 shrink-0" />
        {{ store.selectedIds.size }} элемента выбрано — изменения применятся ко всем
      </div>

      <!-- Single-node header -->
      <div v-if="!store.isMultiSelect" class="px-3 py-2.5 border-b shrink-0">
        <div class="flex items-center gap-2">
          <Badge variant="outline" class="text-xs shrink-0 font-mono">{{ node.type }}</Badge>
          <Input
            :model-value="node.name"
            class="h-7 text-xs"
            @update:model-value="store.renameNode(node.id, String($event))"
          />
        </div>
      </div>

      <!-- ListView node: full-panel config (single select only) -->
      <template v-if="isListViewNode && !store.isMultiSelect">
        <div class="px-3 py-2 border-b shrink-0 flex items-center gap-2">
          <p class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex-1">
            Настройки ListView
          </p>
          <Badge variant="secondary" class="text-[10px]">sources</Badge>
        </div>
        <ListViewConfigPanel />
      </template>

      <!-- WidgetRef node: slot config (single select only) -->
      <template v-else-if="isWidgetRefNode && !store.isMultiSelect">
        <div class="px-3 py-2 border-b shrink-0 flex items-center gap-2">
          <p class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex-1">
            Встроенный виджет
          </p>
          <Badge variant="secondary" class="text-[10px] text-violet-500">ref</Badge>
        </div>
        <WidgetRefConfigPanel />
      </template>

      <!-- Regular node sections (always for multi-select; for regular nodes otherwise) -->
      <div v-else class="flex-1 overflow-y-auto">
        <PropertySection v-if="!store.isMultiSelect" label="Responsive" :default-open="true">
          <ResponsiveSection />
        </PropertySection>

        <PropertySection label="Размер" :default-open="true">
          <SizeSection />
        </PropertySection>

        <PropertySection label="Отступы">
          <SpacingSection />
        </PropertySection>

        <PropertySection v-if="isFlexContainer" label="Расположение (Flex)" :default-open="true">
          <FlexSection />
        </PropertySection>

        <PropertySection label="Цвета" :default-open="true">
          <ColorsSection />
        </PropertySection>

        <PropertySection label="Граница">
          <BorderSection />
        </PropertySection>

        <PropertySection v-if="hasTypography" label="Типография">
          <TypographySection />
        </PropertySection>

        <PropertySection v-if="hasContent" label="Контент" :default-open="true">
          <ContentSection />
        </PropertySection>

        <PropertySection v-if="showDataSection" label="Данные" :default-open="true">
          <DataBindingPanel />
        </PropertySection>

        <PropertySection v-if="!store.isMultiSelect" label="Действия" :default-open="false">
          <NodeActionsPanel />
        </PropertySection>
      </div>
    </template>
  </div>
</template>
