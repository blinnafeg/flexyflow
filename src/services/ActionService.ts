import type { ActionStep, ActionContext } from '@/types'
import { visibilityService } from './VisibilityService'
import { eventService } from './EventService'

type StateStore = Record<string, unknown>
const globalState: StateStore = {}

function checkConditions(step: ActionStep, context: ActionContext): boolean {
  if (!step.conditions || step.conditions.length === 0) return true

  return step.conditions.every(cond => {
    const val = (context.state[cond.field] ?? globalState[cond.field]) as unknown
    switch (cond.operator) {
      case '==': return val == cond.value
      case '!=': return val != cond.value
      case '>':  return (val as number) > (cond.value as number)
      case '<':  return (val as number) < (cond.value as number)
      case '>=': return (val as number) >= (cond.value as number)
      case '<=': return (val as number) <= (cond.value as number)
      default:   return true
    }
  })
}

async function executeStep(step: ActionStep, context: ActionContext): Promise<void> {
  if (!checkConditions(step, context)) return

  try {
    await runAction(step, context)
    if (step.onSuccess?.length) {
      for (const s of step.onSuccess) {
        await executeStep(s, context)
      }
    }
  } catch (err) {
    console.error(`[ActionService] Step "${step.type}" failed:`, err)
    if (step.onError?.length) {
      for (const s of step.onError) {
        await executeStep(s, context)
      }
    }
  }
}

async function runAction(step: ActionStep, context: ActionContext): Promise<void> {
  const cfg = step.config

  switch (step.type) {
    // ── Visibility ──────────────────────────────────────────────────────────
    case 'visibility.show':
      visibilityService.show(cfg.elementId as string)
      break

    case 'visibility.hide':
      visibilityService.hide(cfg.elementId as string)
      break

    case 'visibility.toggle':
      visibilityService.toggle(cfg.elementId as string)
      break

    // ── Navigation ──────────────────────────────────────────────────────────
    case 'navigation.navigate':
      eventService.emit('navigate', { url: cfg.url, pageId: cfg.pageId })
      break

    case 'navigation.back':
      eventService.emit('navigate:back')
      break

    // ── Data ────────────────────────────────────────────────────────────────
    case 'data.fetch': {
      const resp = await fetch(cfg.endpoint as string, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`)
      const data = await resp.json()
      if (cfg.storeKey) globalState[cfg.storeKey as string] = data
      eventService.emit('data:fetched', { key: cfg.storeKey, data })
      break
    }

    case 'data.create': {
      const resp = await fetch(cfg.endpoint as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg.body ?? {}),
      })
      if (!resp.ok) throw new Error(`Create failed: ${resp.status}`)
      const data = await resp.json()
      eventService.emit('data:created', data)
      break
    }

    case 'data.update': {
      const resp = await fetch(cfg.endpoint as string, {
        method: cfg.method as string ?? 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg.body ?? {}),
      })
      if (!resp.ok) throw new Error(`Update failed: ${resp.status}`)
      eventService.emit('data:updated', await resp.json())
      break
    }

    case 'data.delete': {
      const resp = await fetch(cfg.endpoint as string, { method: 'DELETE' })
      if (!resp.ok) throw new Error(`Delete failed: ${resp.status}`)
      eventService.emit('data:deleted', { endpoint: cfg.endpoint })
      break
    }

    // ── State ───────────────────────────────────────────────────────────────
    case 'state.set':
      globalState[cfg.key as string] = cfg.value
      context.state[cfg.key as string] = cfg.value
      eventService.emit('state:set', { key: cfg.key, value: cfg.value })
      break

    case 'state.clear':
      if (cfg.key) {
        delete globalState[cfg.key as string]
        delete context.state[cfg.key as string]
      }
      eventService.emit('state:cleared', { key: cfg.key })
      break

    // ── UI ──────────────────────────────────────────────────────────────────
    case 'ui.showToast':
      eventService.emit('ui:toast', {
        message: cfg.message,
        type: cfg.toastType ?? 'default',
        duration: cfg.duration ?? 3000,
      })
      break

    case 'ui.showModal':
      eventService.emit('ui:modal', {
        title: cfg.title,
        content: cfg.content,
        modalId: cfg.modalId,
      })
      break

    case 'ui.scrollTo':
      {
        const el = document.getElementById(cfg.elementId as string)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      break

    // ── Custom ──────────────────────────────────────────────────────────────
    case 'custom.code': {
      const sandbox = {
        context,
        state: globalState,
        visibility: visibilityService,
        events: eventService,
        console,
      }
      const fn = new Function(...Object.keys(sandbox), `"use strict";\n${cfg.code as string}`)
      await fn(...Object.values(sandbox))
      break
    }

    default:
      console.warn(`[ActionService] Unknown action type: ${(step as ActionStep).type}`)
  }
}

export const actionService = { executeStep }
