<script setup lang="ts">
import { computed } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import type { SizeValue, SizeUnit } from '@/types/widget-builder'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode!)

function updateSize(field: 'width' | 'height' | 'minWidth' | 'minHeight' | 'maxWidth' | 'maxHeight', patch: Partial<SizeValue>) {
  const cur = (node.value.props[field] as SizeValue | undefined) ?? { value: 0, unit: 'px' as SizeUnit }
  store.updateProps(node.value.id, { [field]: { ...cur, ...patch } })
}

function setUnit(field: 'width' | 'height', unit: SizeUnit) {
  updateSize(field, { unit, value: unit === 'auto' ? 0 : (node.value.props[field]?.value ?? 0) })
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Размер</p>

    <!-- Width -->
    <div class="space-y-1">
      <Label class="text-xs">Ширина</Label>
      <div class="flex gap-1">
        <Input
          :model-value="node.props.width.unit !== 'auto' ? node.props.width.value : ''"
          type="number" min="0" class="h-7 text-xs"
          :disabled="node.props.width.unit === 'auto'"
          @update:model-value="updateSize('width', { value: Number($event) })"
        />
        <Select :model-value="node.props.width.unit" @update:model-value="setUnit('width', $event as SizeUnit)">
          <SelectTrigger class="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="px">px</SelectItem>
            <SelectItem value="%">%</SelectItem>
            <SelectItem value="auto">auto</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Height -->
    <div class="space-y-1">
      <Label class="text-xs">Высота</Label>
      <div class="flex gap-1">
        <Input
          :model-value="node.props.height.unit !== 'auto' ? node.props.height.value : ''"
          type="number" min="0" class="h-7 text-xs"
          :disabled="node.props.height.unit === 'auto'"
          @update:model-value="updateSize('height', { value: Number($event) })"
        />
        <Select :model-value="node.props.height.unit" @update:model-value="setUnit('height', $event as SizeUnit)">
          <SelectTrigger class="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="px">px</SelectItem>
            <SelectItem value="%">%</SelectItem>
            <SelectItem value="auto">auto</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Min height -->
    <div class="space-y-1">
      <Label class="text-xs text-muted-foreground">Min высота (px)</Label>
      <Input
        :model-value="node.props.minHeight?.value ?? ''"
        type="number" min="0" class="h-7 text-xs"
        placeholder="—"
        @update:model-value="updateSize('minHeight', { value: Number($event), unit: 'px' })"
      />
    </div>
  </div>
</template>
