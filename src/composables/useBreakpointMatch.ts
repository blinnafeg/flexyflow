import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBreakpointsStore } from '@/stores/breakpoints.store'
import type { BreakpointId } from '@/types/breakpoints'

/**
 * Returns a reactive breakpoint ID that updates on window resize.
 * Used in PreviewNode to apply responsive visibility at runtime.
 */
export function useBreakpointMatch() {
  const bpStore = useBreakpointsStore()
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)

  function onResize() {
    windowWidth.value = window.innerWidth
  }

  onMounted(() => window.addEventListener('resize', onResize))
  onUnmounted(() => window.removeEventListener('resize', onResize))

  const currentId = computed<BreakpointId>(() => bpStore.getIdForWidth(windowWidth.value))

  return { currentId, windowWidth }
}
