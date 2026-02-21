import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Workflow, TriggerType } from '@/types'

export const useBuilderStore = defineStore('builder', () => {
  // Currently edited workflow
  const activeWorkflow = ref<Workflow | null>(null)

  // Selected element in page editor
  const selectedSlotName = ref<string | null>(null)
  const selectedWidgetId = ref<string | null>(null)

  // Preview mode toggle
  const isPreviewMode = ref(false)

  // Action palette visibility
  const isPaletteOpen = ref(false)

  function setActiveWorkflow(w: Workflow | null) {
    activeWorkflow.value = w
  }

  function selectSlot(name: string | null) {
    selectedSlotName.value = name
    selectedWidgetId.value = null
  }

  function selectWidget(id: string | null) {
    selectedWidgetId.value = id
  }

  function setTrigger(trigger: TriggerType) {
    if (activeWorkflow.value) {
      activeWorkflow.value.trigger = trigger
    }
  }

  function togglePreview() {
    isPreviewMode.value = !isPreviewMode.value
  }

  function openPalette() {
    isPaletteOpen.value = true
  }

  function closePalette() {
    isPaletteOpen.value = false
  }

  function reset() {
    activeWorkflow.value = null
    selectedSlotName.value = null
    selectedWidgetId.value = null
    isPreviewMode.value = false
    isPaletteOpen.value = false
  }

  return {
    activeWorkflow,
    selectedSlotName,
    selectedWidgetId,
    isPreviewMode,
    isPaletteOpen,
    setActiveWorkflow,
    selectSlot,
    selectWidget,
    setTrigger,
    togglePreview,
    openPalette,
    closePalette,
    reset,
  }
})
