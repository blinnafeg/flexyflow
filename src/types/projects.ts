export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Page {
  id: string
  projectId: string
  name: string
  slug: string
  layoutId?: string
  content: Record<string, { widgetId: string; order: number }[]>
  isPublished: boolean
  createdAt: string
  updatedAt: string
}
