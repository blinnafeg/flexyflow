<script setup lang="ts">
import { computed } from 'vue'
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

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode)

const isListViewNode  = computed(() => node.value?.type === 'ListView')
const isWidgetRefNode = computed(() => node.value?.type === 'WidgetRef')
const isFlexContainer = computed(() =>
  node.value && ['Column', 'Row', 'Container'].includes(node.value.type)
)
const hasTypography = computed(() =>
  node.value && ['Text', 'Button', 'TextField', 'RichText'].includes(node.value.type)
)
const hasContent = computed(() =>
  node.value && ['Text', 'Button', 'TextField', 'RichText', 'Icon'].includes(node.value.type)
)
const showDataSection = computed(() =>
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
      <!-- Node header -->
      <div class="px-3 py-2.5 border-b shrink-0">
        <div class="flex items-center gap-2">
          <Badge variant="outline" class="text-xs shrink-0 font-mono">{{ node.type }}</Badge>
          <Input
            :model-value="node.name"
            class="h-7 text-xs"
            @update:model-value="store.renameNode(node.id, $event)"
          />
        </div>
      </div>

      <!-- ListView node: full-panel config -->
      <template v-if="isListViewNode">
        <div class="px-3 py-2 border-b shrink-0 flex items-center gap-2">
          <p class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex-1">
            Настройки ListView
          </p>
          <Badge variant="secondary" class="text-[10px]">sources</Badge>
        </div>
        <ListViewConfigPanel />
      </template>

      <!-- WidgetRef node: slot config -->
      <template v-else-if="isWidgetRefNode">
        <div class="px-3 py-2 border-b shrink-0 flex items-center gap-2">
          <p class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex-1">
            Встроенный виджет
          </p>
          <Badge variant="secondary" class="text-[10px] text-violet-500">ref</Badge>
        </div>
        <WidgetRefConfigPanel />
      </template>

      <!-- Regular node: collapsible sections -->
      <div v-else class="flex-1 overflow-y-auto">
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

        <PropertySection label="Действия" :default-open="false">
          <NodeActionsPanel />
        </PropertySection>
      </div>
    </template>
  </div>
</template>
