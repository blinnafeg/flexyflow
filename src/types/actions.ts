export type TriggerType =
  | 'onClick'
  | 'onSubmit'
  | 'onInit'
  | 'onChange'
  | 'onHover'
  | 'onPageLoad'
  | 'onWidgetMount'

export type ActionCategory = 'visibility' | 'navigation' | 'data' | 'state' | 'ui' | 'custom'

export type ActionType =
  | 'visibility.show'
  | 'visibility.hide'
  | 'visibility.toggle'
  | 'navigation.navigate'
  | 'navigation.back'
  | 'data.fetch'
  | 'data.create'
  | 'data.update'
  | 'data.delete'
  | 'state.set'
  | 'state.clear'
  | 'ui.showToast'
  | 'ui.showModal'
  | 'ui.scrollTo'
  | 'custom.code'

export interface Condition {
  field: string
  operator: '==' | '!=' | '>' | '<' | '>=' | '<='
  value: unknown
}

export interface ActionStep {
  id: string
  type: ActionType
  label?: string
  config: Record<string, unknown>
  conditions?: Condition[]
  onSuccess?: ActionStep[]
  onError?: ActionStep[]
}

export interface Workflow {
  id: string
  name: string
  trigger: TriggerType
  widgetId?: string
  pageId?: string
  projectId: string
  steps: ActionStep[]
  createdAt: string
  updatedAt: string
}

export interface ActionConfigField {
  key: string
  label: string
  type: 'text' | 'select' | 'boolean' | 'code' | 'elementId' | 'pageId'
  options?: { label: string; value: string }[]
  required?: boolean
  placeholder?: string
  description?: string
}

export interface ActionDefinition {
  type: ActionType
  category: ActionCategory
  label: string
  description: string
  icon: string
  configFields: ActionConfigField[]
}

export interface ActionContext {
  pageId: string
  widgetId?: string
  triggerData?: unknown
  state: Record<string, unknown>
}

export interface CustomActionDefinition {
  id: string
  projectId: string
  name: string
  description?: string
  code: string
  inputs: ActionConfigField[]
  outputs: { key: string; label: string; type: string }[]
  createdAt: string
}
