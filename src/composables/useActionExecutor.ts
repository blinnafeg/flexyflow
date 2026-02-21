import { useVisibilityStore } from '@/stores/visibility.store'
import type { ActionStep } from '@/types'

export function useActionExecutor() {
  const visibilityStore = useVisibilityStore()

  function execute(step: ActionStep): void {
    switch (step.type) {
      case 'visibility.show':
        if (step.config.elementId) visibilityStore.show(step.config.elementId as string)
        break
      case 'visibility.hide':
        if (step.config.elementId) visibilityStore.hide(step.config.elementId as string)
        break
      case 'visibility.toggle':
        if (step.config.elementId) visibilityStore.toggle(step.config.elementId as string)
        break
      case 'navigation.navigate':
        if (step.config.url) window.location.href = step.config.url as string
        break
      case 'navigation.back':
        window.history.back()
        break
      case 'ui.showToast':
        // toast integration can be added here
        console.info('[Action] showToast:', step.config.message)
        break
      case 'state.set':
        // global app state (extend as needed)
        console.info('[Action] state.set:', step.config.key, '=', step.config.value)
        break
      case 'custom.code':
        if (step.config.code) {
          try {
            const fn = new Function('visibility', 'console', step.config.code as string)
            fn(visibilityStore, console)
          } catch (e) {
            console.error('[Action] custom.code error:', e)
          }
        }
        break
      default:
        console.warn('[Action] unhandled type:', step.type)
    }
  }

  function executeAll(steps: ActionStep[] | undefined): void {
    if (!steps?.length) return
    for (const step of steps) execute(step)
  }

  return { execute, executeAll }
}
