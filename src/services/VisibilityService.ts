import { reactive, readonly } from 'vue'

const state = reactive<Record<string, boolean>>({})

export const visibilityService = {
  state: readonly(state),

  show(id: string): void {
    state[id] = true
  },

  hide(id: string): void {
    state[id] = false
  },

  toggle(id: string): void {
    state[id] = !state[id]
  },

  isVisible(id: string, defaultValue = true): boolean {
    if (id in state) return state[id]
    return defaultValue
  },

  reset(): void {
    for (const key in state) {
      delete state[key]
    }
  },
}
