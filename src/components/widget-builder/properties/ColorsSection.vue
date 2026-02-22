<script setup lang="ts">
import { computed } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { Label } from '@/components/ui/label'
import ColorPickerInput from '@/components/color-picker/ColorPickerInput.vue'

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
    <!-- Background color -->
    <div class="space-y-1">
      <Label class="text-xs text-muted-foreground">Фон</Label>
      <ColorPickerInput
        :model-value="node.props.backgroundColor"
        placeholder="transparent"
        :allow-clear="true"
        @update:model-value="updateColor('backgroundColor', $event)"
      />
    </div>

    <!-- Text / icon color -->
    <div class="space-y-1">
      <Label class="text-xs text-muted-foreground">Цвет текста</Label>
      <ColorPickerInput
        :model-value="node.props.color"
        placeholder="#111827"
        :allow-clear="true"
        @update:model-value="updateColor('color', $event)"
      />
    </div>

    <!-- Opacity -->
    <div class="space-y-1">
      <div class="flex items-center justify-between">
        <Label class="text-xs text-muted-foreground">Прозрачность</Label>
        <span class="text-xs font-mono text-muted-foreground">{{ node.props.opacity }}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        :value="node.props.opacity"
        class="w-full h-1.5 accent-primary"
        @input="updateOpacity(Number(($event.target as HTMLInputElement).value))"
      />
    </div>
  </div>
</template>
