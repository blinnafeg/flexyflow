<script setup lang="ts">
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import CanvasNode from './CanvasNode.vue'

const store = useWidgetBuilderStore()
</script>

<template>
  <div class="w-full min-h-full" @click="store.select(null)">
    <CanvasNode
      v-if="store.widget"
      :node="store.widget.root"
      :editor-mode="true"
    />
  </div>
</template>
