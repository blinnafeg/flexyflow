<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import type { SpacingSide } from '@/types/widget-builder'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Link } from 'lucide-vue-next'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode!)

const paddingLinked = ref(false)
const marginLinked = ref(false)

function updateSpacing(field: 'padding' | 'margin', side: keyof SpacingSide, val: number, linked: boolean) {
  if (linked) {
    store.updatePropsSelected({ [field]: { top: val, right: val, bottom: val, left: val } })
  } else {
    store.updatePropsSelected({ [field]: { ...node.value.props[field], [side]: val } })
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Padding -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Отступ внутри (Padding)</p>
        <button
          :class="paddingLinked ? 'text-primary' : 'text-muted-foreground'"
          title="Связать"
          @click="paddingLinked = !paddingLinked"
        ><Link class="size-3" /></button>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <div v-for="side in (['top','right','bottom','left'] as const)" :key="side">
          <Label class="text-[10px] text-muted-foreground capitalize">{{ side }}</Label>
          <Input
            :model-value="node.props.padding[side]"
            type="number" min="0" class="h-7 text-xs"
            @update:model-value="updateSpacing('padding', side, Number($event), paddingLinked)"
          />
        </div>
      </div>
    </div>

    <!-- Margin -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Отступ снаружи (Margin)</p>
        <button
          :class="marginLinked ? 'text-primary' : 'text-muted-foreground'"
          title="Связать"
          @click="marginLinked = !marginLinked"
        ><Link class="size-3" /></button>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <div v-for="side in (['top','right','bottom','left'] as const)" :key="side">
          <Label class="text-[10px] text-muted-foreground capitalize">{{ side }}</Label>
          <Input
            :model-value="node.props.margin[side]"
            type="number" min="0" class="h-7 text-xs"
            @update:model-value="updateSpacing('margin', side, Number($event), marginLinked)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
