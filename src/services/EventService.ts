type EventHandler = (payload?: unknown) => void

class EventService {
  private handlers: Map<string, Set<EventHandler>> = new Map()

  on(event: string, fn: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(fn)
  }

  off(event: string, fn: EventHandler): void {
    this.handlers.get(event)?.delete(fn)
  }

  emit(event: string, payload?: unknown): void {
    this.handlers.get(event)?.forEach(fn => fn(payload))
  }

  once(event: string, fn: EventHandler): void {
    const wrapper: EventHandler = (payload) => {
      fn(payload)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  clear(event?: string): void {
    if (event) {
      this.handlers.delete(event)
    } else {
      this.handlers.clear()
    }
  }
}

export const eventService = new EventService()
