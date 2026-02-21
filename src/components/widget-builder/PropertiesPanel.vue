<script setup lang="ts">
import { computed } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import SizeSection        from './properties/SizeSection.vue'
import SpacingSection     from './properties/SpacingSection.vue'
import BorderSection      from './properties/BorderSection.vue'
import ColorsSection      from './properties/ColorsSection.vue'
import TypographySection  from './properties/TypographySection.vue'
import FlexSection        from './properties/FlexSection.vue'
import ContentSection     from './properties/ContentSection.vue'
import ListViewConfigPanel from './ListViewConfigPanel.vue'
import DataBindingPanel   from './DataBindingPanel.vue'
import NodeActionsPanel   from './NodeActionsPanel.vue'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode)

const isListViewNode = computed(() => node.value?.type === 'ListView')
const isFlexContainer = computed(() =>
  node.value && ['Column', 'Row', 'Container'].includes(node.value.type)
)
const hasTypography = computed(() =>
  node.value && ['Text', 'Button', 'TextField', 'RichText'].includes(node.value.type)
)
const hasContent = computed(() =>
  node.value && ['Text', 'Button', 'TextField', 'RichText', 'Icon'].includes(node.value.type)
)
// Show "Data" tab only for list-item widgets on bindable node types
const showDataTab = computed(() =>
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
      <div class="px-3 py-2.5 border-b shrink-0 space-y-2">
        <div class="flex items-center gap-2">
          <Badge variant="outline" class="text-xs shrink-0">{{ node.type }}</Badge>
          <Input
            :model-value="node.name"
            class="h-7 text-xs"
            @update:model-value="store.renameNode(node.id, $event)"
          />
        </div>
      </div>

      <!-- ListView node: show full-panel config instead of regular tabs -->
      <template v-if="isListViewNode">
        <div class="px-3 py-2 border-b shrink-0 flex items-center gap-2">
          <p class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex-1">
            Настройки ListView
          </p>
          <Badge variant="secondary" class="text-[10px]">sources</Badge>
        </div>
        <ListViewConfigPanel />
      </template>

      <!-- Regular node: tabs -->
      <Tabs v-else default-value="layout" class="flex-1 flex flex-col overflow-hidden">
        <TabsList class="mx-3 mt-2 shrink-0 h-8">
          <TabsTrigger value="layout" class="text-xs">Layout</TabsTrigger>
          <TabsTrigger value="style" class="text-xs">Style</TabsTrigger>
          <TabsTrigger v-if="hasContent" value="content" class="text-xs">Content</TabsTrigger>
          <TabsTrigger v-if="showDataTab" value="data" class="text-xs text-blue-500">Data</TabsTrigger>
          <TabsTrigger value="actions" class="text-xs">Actions</TabsTrigger>
        </TabsList>

        <!-- Layout tab -->
        <TabsContent value="layout" class="flex-1 overflow-y-auto mt-0">
          <div class="p-3 space-y-4">
            <SizeSection />
            <Separator />
            <SpacingSection />
            <template v-if="isFlexContainer">
              <Separator />
              <FlexSection />
            </template>
          </div>
        </TabsContent>

        <!-- Style tab -->
        <TabsContent value="style" class="flex-1 overflow-y-auto mt-0">
          <div class="p-3 space-y-4">
            <ColorsSection />
            <Separator />
            <BorderSection />
            <template v-if="hasTypography">
              <Separator />
              <TypographySection />
            </template>
          </div>
        </TabsContent>

        <!-- Content tab -->
        <TabsContent v-if="hasContent" value="content" class="flex-1 overflow-y-auto mt-0">
          <div class="p-3">
            <ContentSection />
          </div>
        </TabsContent>

        <!-- Data binding tab (list-item widgets only) -->
        <TabsContent v-if="showDataTab" value="data" class="flex-1 overflow-y-auto mt-0">
          <DataBindingPanel />
        </TabsContent>

        <!-- Actions tab -->
        <TabsContent value="actions" class="flex-1 overflow-y-auto mt-0">
          <NodeActionsPanel />
        </TabsContent>
      </Tabs>
    </template>
  </div>
</template>
