<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { WidgetNode } from '@/types/widget-builder'
import type { WidgetElementsV2 } from '@/types/list-view'
import { supabase } from '@/lib/supabase'
import { useVisibilityStore } from '@/stores/visibility.store'
import PreviewNode from './PreviewNode.vue'

const props = defineProps<{
  widgetId: string
}>()

const root    = ref<WidgetNode | null>(null)
const loading = ref(true)
const error   = ref<string | null>(null)

const visibilityStore = useVisibilityStore()
// Whole-widget visibility: key is 'w:<widgetId>'
const isWidgetVisible = computed(() =>
  visibilityStore.isVisible('w:' + props.widgetId, true)
)

onMounted(async () => {
  try {
    const { data, error: e } = await supabase
      .from('ff_widgets')
      .select('elements')
      .eq('id', props.widgetId)
      .single()

    if (e) throw e
    if (!data) throw new Error('Виджет не найден')

    const raw = data.elements

    if (Array.isArray(raw) && raw[0]) {
      // v1 legacy format: elements is an array, first item is root
      root.value = raw[0] as WidgetNode
    } else if (raw && (raw as { v?: number }).v === 2) {
      // v2 format: { v: 2, root, widgetKind, listItemMeta }
      root.value = (raw as unknown as WidgetElementsV2).root as WidgetNode
    }
  } catch (e: unknown) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <!-- Whole-widget visibility (toggled via 'w:<widgetId>' in visibilityStore) -->
  <template v-if="!isWidgetVisible" />

  <div
    v-else-if="loading"
    class="flex items-center justify-center py-4 text-xs text-gray-400 animate-pulse"
  >
    Загрузка...
  </div>

  <div
    v-else-if="error"
    class="flex items-center justify-center py-4 text-xs text-red-400"
  >
    {{ error }}
  </div>

  <PreviewNode
    v-else-if="root"
    :node="root"
    :root-style="{ width: '100%' }"
  />

</template>
