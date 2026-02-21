<script setup lang="ts">
import { computed } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import type { TypographyProps } from '@/types/widget-builder'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-vue-next'
import FontPicker from './FontPicker.vue'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode!)

function update(patch: Partial<TypographyProps>) {
  const cur = node.value.props.typography ?? {
    fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: 0, textAlign: 'left',
  }
  store.updateProps(node.value.id, { typography: { ...cur, ...patch } })
}

const aligns = [
  { value: 'left', icon: AlignLeft },
  { value: 'center', icon: AlignCenter },
  { value: 'right', icon: AlignRight },
  { value: 'justify', icon: AlignJustify },
]
</script>

<template>
  <div v-if="node.props.typography" class="space-y-3">
    <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Типографика</p>

    <!-- Font family -->
    <div class="space-y-1">
      <Label class="text-xs">Шрифт (Google Fonts)</Label>
      <FontPicker
        :model-value="node.props.typography.fontFamily"
        @update:model-value="update({ fontFamily: $event })"
      />
    </div>

    <!-- Font size -->
    <div class="grid grid-cols-2 gap-1.5">
      <div>
        <Label class="text-xs">Размер (px)</Label>
        <Input
          :model-value="node.props.typography.fontSize" type="number" min="1" class="h-7 text-xs"
          @update:model-value="update({ fontSize: Number($event) })"
        />
      </div>
      <div>
        <Label class="text-xs">Насыщенность</Label>
        <Select :model-value="node.props.typography.fontWeight" @update:model-value="update({ fontWeight: $event as any })">
          <SelectTrigger class="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="300">Light 300</SelectItem>
            <SelectItem value="400">Regular 400</SelectItem>
            <SelectItem value="500">Medium 500</SelectItem>
            <SelectItem value="600">SemiBold 600</SelectItem>
            <SelectItem value="700">Bold 700</SelectItem>
            <SelectItem value="800">ExtraBold 800</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label class="text-xs">Line height</Label>
        <Input
          :model-value="node.props.typography.lineHeight" type="number" min="0.5" step="0.1" class="h-7 text-xs"
          @update:model-value="update({ lineHeight: Number($event) })"
        />
      </div>
      <div>
        <Label class="text-xs">Letter spacing</Label>
        <Input
          :model-value="node.props.typography.letterSpacing" type="number" step="0.1" class="h-7 text-xs"
          @update:model-value="update({ letterSpacing: Number($event) })"
        />
      </div>
    </div>

    <!-- Text align -->
    <div class="space-y-1">
      <Label class="text-xs">Выравнивание</Label>
      <div class="flex gap-1">
        <button
          v-for="a in aligns" :key="a.value"
          class="flex-1 flex items-center justify-center h-7 rounded border transition-colors"
          :class="node.props.typography.textAlign === a.value
            ? 'bg-primary text-primary-foreground border-primary'
            : 'border-border hover:bg-accent'"
          @click="update({ textAlign: a.value as any })"
        >
          <component :is="a.icon" class="size-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
