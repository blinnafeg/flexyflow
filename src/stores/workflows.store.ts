import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Workflow } from '@/types'
import * as WorkflowService from '@/services/WorkflowService'

export const useWorkflowsStore = defineStore('workflows', () => {
  const workflows = ref<Workflow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const byId = computed(() =>
    workflows.value.reduce<Record<string, Workflow>>((acc, w) => {
      acc[w.id] = w
      return acc
    }, {})
  )

  function forWidget(widgetId: string) {
    return workflows.value.filter(w => w.widgetId === widgetId)
  }

  function forPage(pageId: string) {
    return workflows.value.filter(w => w.pageId === pageId)
  }

  async function load(projectId: string) {
    loading.value = true
    error.value = null
    try {
      workflows.value = await WorkflowService.fetchWorkflows(projectId)
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function create(payload: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) {
    const created = await WorkflowService.createWorkflow(payload)
    workflows.value.unshift(created)
    return created
  }

  async function update(id: string, payload: Partial<Workflow>) {
    const updated = await WorkflowService.updateWorkflow(id, payload)
    const idx = workflows.value.findIndex(w => w.id === id)
    if (idx !== -1) workflows.value[idx] = updated
    return updated
  }

  async function remove(id: string) {
    await WorkflowService.deleteWorkflow(id)
    workflows.value = workflows.value.filter(w => w.id !== id)
  }

  return { workflows, loading, error, byId, forWidget, forPage, load, create, update, remove }
})
