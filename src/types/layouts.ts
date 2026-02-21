export interface GridSlot {
  id: string
  name: string
  label: string
  row: number
  col: number
  rowSpan: number
  colSpan: number
}

export interface LayoutConfig {
  gridCols: number
  gridRows: number
  colWidths: string[]
  rowHeights: string[]
  gap: string
}

export interface Layout {
  id: string
  projectId: string
  name: string
  config: LayoutConfig
  slots: GridSlot[]
  createdAt: string
  updatedAt: string
}
