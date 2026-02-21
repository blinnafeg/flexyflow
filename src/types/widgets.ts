export interface WidgetElement {
  id: string
  type: 'text' | 'heading' | 'button' | 'image' | 'container' | 'input' | 'list'
  label?: string
  props: Record<string, unknown>
  styles?: Record<string, string>
  children?: WidgetElement[]
  workflows?: Partial<Record<string, string>>
}

export interface Widget {
  id: string
  name: string
  projectId: string
  elements: WidgetElement[]
  createdAt: string
  updatedAt: string
}

export interface WidgetAssignment {
  widgetId: string
  order: number
}
