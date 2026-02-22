import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Breakpoint, BreakpointId } from '@/types/breakpoints'
import { DEFAULT_BREAKPOINTS } from '@/types/breakpoints'
import { supabase } from '@/lib/supabase'

export const useBreakpointsStore = defineStore('breakpoints', () => {
  const projectId  = ref<string | null>(null)
  const breakpoints = ref<Breakpoint[]>(DEFAULT_BREAKPOINTS.map(b => ({ ...b })))

  /** Active breakpoint in the widget editor canvas (not persisted) */
  const activeId = ref<BreakpointId>('desktop')

  const active = computed(
    () => breakpoints.value.find(b => b.id === activeId.value) ?? breakpoints.value[3]
  )

  /** Returns the breakpoint id that matches the given viewport width */
  function getIdForWidth(width: number): BreakpointId {
    const sorted = [...breakpoints.value].sort((a, b) => b.minWidth - a.minWidth)
    return sorted.find(b => width >= b.minWidth)?.id ?? 'mobile'
  }

  async function load(pid: string) {
    if (projectId.value === pid) return
    projectId.value = pid

    const { data, error } = await supabase
      .from('ff_projects')
      .select('breakpoints')
      .eq('id', pid)
      .single()

    if (error || !data?.breakpoints) {
      breakpoints.value = DEFAULT_BREAKPOINTS.map(b => ({ ...b }))
    } else {
      breakpoints.value = data.breakpoints as Breakpoint[]
    }
  }

  async function save(): Promise<boolean> {
    if (!projectId.value) return false
    const { error } = await supabase
      .from('ff_projects')
      .update({ breakpoints: breakpoints.value })
      .eq('id', projectId.value)
    return !error
  }

  function updateMinWidth(id: BreakpointId, minWidth: number) {
    breakpoints.value = breakpoints.value.map(b =>
      b.id === id ? { ...b, minWidth } : b
    )
  }

  function reset() {
    projectId.value = null
    breakpoints.value = DEFAULT_BREAKPOINTS.map(b => ({ ...b }))
    activeId.value = 'desktop'
  }

  return {
    projectId,
    breakpoints,
    activeId,
    active,
    getIdForWidth,
    load,
    save,
    updateMinWidth,
    reset,
  }
})
