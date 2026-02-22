<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  label: string
  defaultOpen?: boolean
}>()

const open = ref(props.defaultOpen ?? true)
</script>

<template>
  <div class="border-b last:border-b-0">
    <button
      class="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent/30 transition-colors text-left"
      @click="open = !open"
    >
      <ChevronDown v-if="open" class="size-3 text-muted-foreground shrink-0" />
      <ChevronRight v-else class="size-3 text-muted-foreground shrink-0" />
      <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex-1">
        {{ label }}
      </span>
      <slot name="header-right" />
    </button>
    <div v-show="open" class="px-3 pb-3 pt-0.5">
      <slot />
    </div>
  </div>
</template>
