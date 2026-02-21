import type { Workflow, ActionContext } from '@/types'
import { supabase } from '@/lib/supabase'
import { actionService } from './ActionService'

// ── DB operations ───────────────────────────────────────────────────────────

export async function fetchWorkflows(projectId: string): Promise<Workflow[]> {
  const { data, error } = await supabase
    .from('ff_workflows')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function fetchWorkflow(id: string): Promise<Workflow> {
  const { data, error } = await supabase
    .from('ff_workflows')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return mapRow(data)
}

export async function createWorkflow(payload: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
  const { data, error } = await supabase
    .from('ff_workflows')
    .insert({
      project_id: payload.projectId,
      name: payload.name,
      trigger: payload.trigger,
      steps: payload.steps,
      widget_id: payload.widgetId ?? null,
      page_id: payload.pageId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return mapRow(data)
}

export async function updateWorkflow(id: string, payload: Partial<Workflow>): Promise<Workflow> {
  const { data, error } = await supabase
    .from('ff_workflows')
    .update({
      name: payload.name,
      trigger: payload.trigger,
      steps: payload.steps,
      widget_id: payload.widgetId,
      page_id: payload.pageId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapRow(data)
}

export async function deleteWorkflow(id: string): Promise<void> {
  const { error } = await supabase.from('ff_workflows').delete().eq('id', id)
  if (error) throw error
}

// ── Execution ────────────────────────────────────────────────────────────────

export async function executeWorkflow(workflow: Workflow, context: ActionContext): Promise<void> {
  for (const step of workflow.steps) {
    await actionService.executeStep(step, context)
  }
}

// ── Mapping ──────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): Workflow {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    trigger: row.trigger as Workflow['trigger'],
    steps: (row.steps as Workflow['steps']) ?? [],
    widgetId: row.widget_id as string | undefined,
    pageId: row.page_id as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
