<script setup lang="ts">
import { computed } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode!)

function updateColor(field: 'backgroundColor' | 'color', val: string) {
  store.updateProps(node.value.id, { [field]: val })
}

function updateOpacity(val: number) {
  store.updateProps(node.value.id, { opacity: Math.max(0, Math.min(100, val)) })
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цвета</p>

    <!-- Background color -->
    <div class="space-y-1">
      <Label class="text-xs">Фон</Label>
      <div class="flex items-center gap-1.5">
        <input
          type="color"
          :value="node.props.backgroundColor === 'transparent' ? '#ffffff' : node.props.backgroundColor"
          class="h-7 w-10 cursor-pointer rounded border"
          @input="updateColor('backgroundColor', ($event.target as HTMLInputElement).value)"
        />
        <Input
          :model-value="node.props.backgroundColor" class="h-7 text-xs font-mono"
          placeholder="transparent"
          @update:model-value="updateColor('backgroundColor', $event)"
        />
      </div>
    </div>

    <!-- Text / icon color -->
    <div class="space-y-1">
      <Label class="text-xs">Цвет текста</Label>
      <div class="flex items-center gap-1.5">
        <input
          type="color" :value="node.props.color || '#111827'"
          class="h-7 w-10 cursor-pointer rounded border"
          @input="updateColor('color', ($event.target as HTMLInputElement).value)"
        />
        <Input
          :model-value="node.props.color" class="h-7 text-xs font-mono"
          @update:model-value="updateColor('color', $event)"
        />
      </div>
    </div>

    <!-- Opacity -->
    <div class="space-y-1">
      <Label class="text-xs">Прозрачность ({{ node.props.opacity }}%)</Label>
      <input
        type="range" min="0" max="100"
        :value="node.props.opacity"
        class="w-full h-1.5 accent-primary"
        @input="updateOpacity(Number(($event.target as HTMLInputElement).value))"
      />
    </div>
  </div>
</template>
