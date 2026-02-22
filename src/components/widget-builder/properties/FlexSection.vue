<script setup lang="ts">
import { computed } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import type { FlexProps } from '@/types/widget-builder'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode!)

function update(patch: Partial<FlexProps>) {
  const cur: FlexProps = node.value.props.flex ?? {
    direction: 'column', alignItems: 'flex-start',
    justifyContent: 'flex-start', gap: 0, wrap: false,
  }
  store.updatePropsSelected({ flex: { ...cur, ...patch } })
}

const DEFAULT_FLEX = (): FlexProps => ({
  direction: 'column', alignItems: 'flex-start',
  justifyContent: 'flex-start', gap: 0, wrap: false,
})
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Расположение (Flex)</p>

    <div class="grid grid-cols-2 gap-1.5">
      <!-- Direction -->
      <div class="col-span-2">
        <Label class="text-xs">Направление</Label>
        <div class="flex gap-1 mt-0.5">
          <button
            class="flex-1 h-7 text-xs rounded border transition-colors"
            :class="(node.props.flex ?? DEFAULT_FLEX()).direction === 'column'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border hover:bg-accent'"
            @click="update({ direction: 'column' })"
          >Column ↓</button>
          <button
            class="flex-1 h-7 text-xs rounded border transition-colors"
            :class="(node.props.flex ?? DEFAULT_FLEX()).direction === 'row'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border hover:bg-accent'"
            @click="update({ direction: 'row' })"
          >Row →</button>
        </div>
      </div>

      <!-- Align items -->
      <div>
        <Label class="text-xs">Align Items</Label>
        <Select
          :model-value="(node.props.flex ?? DEFAULT_FLEX()).alignItems"
          @update:model-value="update({ alignItems: $event as any })"
        >
          <SelectTrigger class="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="flex-start">Start</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="flex-end">End</SelectItem>
            <SelectItem value="stretch">Stretch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Justify content -->
      <div>
        <Label class="text-xs">Justify</Label>
        <Select
          :model-value="(node.props.flex ?? DEFAULT_FLEX()).justifyContent"
          @update:model-value="update({ justifyContent: $event as any })"
        >
          <SelectTrigger class="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="flex-start">Start</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="flex-end">End</SelectItem>
            <SelectItem value="space-between">Space Between</SelectItem>
            <SelectItem value="space-around">Space Around</SelectItem>
            <SelectItem value="space-evenly">Space Evenly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Gap -->
      <div>
        <Label class="text-xs">Gap (px)</Label>
        <Input
          :model-value="(node.props.flex ?? DEFAULT_FLEX()).gap"
          type="number" min="0" class="h-7 text-xs"
          @update:model-value="update({ gap: Number($event) })"
        />
      </div>

      <!-- Wrap -->
      <div class="flex items-end pb-0.5">
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            :checked="(node.props.flex ?? DEFAULT_FLEX()).wrap"
            class="accent-primary"
            @change="update({ wrap: ($event.target as HTMLInputElement).checked })"
          />
          <span class="text-xs">Wrap</span>
        </label>
      </div>
    </div>
  </div>
</template>
