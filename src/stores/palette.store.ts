import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { PaletteColor, ColorGroup } from '@/types/palette'
import { DEFAULT_PALETTE, COLOR_GROUPS, COLOR_GROUP_LABELS } from '@/types/palette'
import { supabase } from '@/lib/supabase'

export const usePaletteStore = defineStore('palette', () => {
  const projectId = ref<string | null>(null)
  const colors = ref<PaletteColor[]>([])
  const themeMode = ref<'light' | 'dark'>('light')
  const saveError = ref<string | null>(null)

  /** Colors grouped by ColorGroup, in canonical order */
  const grouped = computed(() => {
    const result: Record<ColorGroup, PaletteColor[]> = {
      brand: [], accent: [], semantic: [], neutral: [],
    }
    for (const c of colors.value) {
      result[c.group].push(c)
    }
    return result
  })

  /** Ordered groups array (only non-empty groups) */
  const groupedList = computed(() =>
    COLOR_GROUPS
      .filter(g => grouped.value[g].length > 0)
      .map(g => ({ key: g, label: COLOR_GROUP_LABELS[g], colors: grouped.value[g] }))
  )

  /** All groups including empty ones (for the editor) */
  const allGroupsList = computed(() =>
    COLOR_GROUPS.map(g => ({ key: g, label: COLOR_GROUP_LABELS[g], colors: grouped.value[g] }))
  )

  function resolveColor(c: PaletteColor): string {
    return themeMode.value === 'dark' ? c.dark : c.light
  }

  async function load(pid: string) {
    if (projectId.value === pid && colors.value.length > 0) return
    projectId.value = pid
    saveError.value = null
    const { data, error } = await supabase
      .from('ff_projects')
      .select('color_palette')
      .eq('id', pid)
      .single()
    if (error || !data?.color_palette) {
      colors.value = DEFAULT_PALETTE.map(c => ({ ...c }))
    } else {
      colors.value = (data.color_palette as PaletteColor[])
    }
  }

  async function save(): Promise<boolean> {
    if (!projectId.value) return false
    saveError.value = null
    const { error } = await supabase
      .from('ff_projects')
      .update({ color_palette: colors.value })
      .eq('id', projectId.value)
    if (error) {
      saveError.value = error.message
      return false
    }
    return true
  }

  function addColor(group: ColorGroup) {
    colors.value = [
      ...colors.value,
      { id: nanoid(8), name: 'New Color', group, light: '#000000', dark: '#ffffff' },
    ]
  }

  function removeColor(id: string) {
    colors.value = colors.value.filter(c => c.id !== id)
  }

  function updateColor(id: string, patch: Partial<PaletteColor>) {
    colors.value = colors.value.map(c => c.id === id ? { ...c, ...patch } : c)
  }

  function reset() {
    projectId.value = null
    colors.value = []
    saveError.value = null
  }

  return {
    projectId,
    colors,
    themeMode,
    saveError,
    grouped,
    groupedList,
    allGroupsList,
    resolveColor,
    load,
    save,
    addColor,
    removeColor,
    updateColor,
    reset,
  }
})
