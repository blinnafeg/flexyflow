import { defineStore } from 'pinia'
import { reactive, readonly } from 'vue'

export const useVisibilityStore = defineStore('visibility', () => {
  const state = reactive<Record<string, boolean>>({})

  function show(id: string) {
    state[id] = true
  }

  function hide(id: string) {
    state[id] = false
  }

  function toggle(id: string) {
    state[id] = !state[id]
  }

  function isVisible(id: string, defaultValue = true): boolean {
    return id in state ? state[id] : defaultValue
  }

  function reset() {
    for (const key in state) delete state[key]
  }

  return { state: readonly(state), show, hide, toggle, isVisible, reset }
})
