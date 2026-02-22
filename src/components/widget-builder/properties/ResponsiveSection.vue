<script setup lang="ts">
import { computed } from 'vue'
import { Smartphone, Tablet, Monitor } from 'lucide-vue-next'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { useBreakpointsStore } from '@/stores/breakpoints.store'
import type { BreakpointId } from '@/types/breakpoints'

const store   = useWidgetBuilderStore()
const bpStore = useBreakpointsStore()
const node    = computed(() => store.selectedNode!)

const BP_ICONS: Record<BreakpointId, typeof Smartphone> = {
  mobile:          Smartphone,
  tablet:          Tablet,
  tabletLandscape: Tablet,
  desktop:         Monitor,
}

function isVisible(bpId: BreakpointId): boolean {
  return node.value.breakpointVisibility?.[bpId] !== false
}

function toggle(bpId: BreakpointId) {
  // currently visible → hide; currently hidden → reset to visible (null = no override)
  store.setBreakpointVisibility(node.value.id, bpId, isVisible(bpId) ? false : null)
}
</script>

<template>
  <div class="flex gap-1.5 py-0.5">
    <button
      v-for="bp in bpStore.breakpoints"
      :key="bp.id"
      :title="`${bp.label}: ${isVisible(bp.id) ? 'видим' : 'скрыт'}`"
      class="flex-1 flex flex-col items-center gap-1 py-1.5 rounded border text-xs transition-all"
      :class="isVisible(bp.id)
        ? 'border-primary/40 bg-primary/5 text-primary'
        : 'border-dashed border-border text-muted-foreground/40'"
      @click="toggle(bp.id)"
    >
      <component :is="BP_ICONS[bp.id]" class="size-3.5" />
      <span class="text-[9px] leading-none font-medium">{{ bp.label.split(' ')[0] }}</span>
    </button>
  </div>
</template>
