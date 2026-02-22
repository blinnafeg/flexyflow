import type { PaletteColor } from './palette'
import type { BreakpointId } from './breakpoints'

export interface Project {
  id: string
  name: string
  description?: string
  supabaseUrl: string
  supabaseAnonKey: string
  palette?: PaletteColor[]
  createdAt: string
  updatedAt: string
}

export interface Page {
  id: string
  projectId: string
  name: string
  slug: string
  layoutId?: string
  responsiveLayouts?: Partial<Record<BreakpointId, string>>
  content: Record<string, { widgetId: string; order: number }[]>
  slotSettings: Record<string, { orientation: 'row' | 'column'; backgroundColor?: string }>
  isPublished: boolean
  createdAt: string
  updatedAt: string
}
