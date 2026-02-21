export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like'

export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: string
}

export interface SortOption {
  field: string
  order: 'asc' | 'desc'
}

export interface ListViewConfig {
  dataSource: {
    type: 'table' | 'view'
    source: string
  }
  filters: FilterCondition[]
  sorting: SortOption[]
  pagination: {
    enabled: boolean
    pageSize: number
  }
  listItemWidgetId: string
}

// Which property of a node is bound to a data field
export type DataBindingProperty = 'text' | 'placeholder'

export interface DataBinding {
  nodeId: string
  property: DataBindingProperty
  field: string
}

export interface ListItemMeta {
  dataSource: {
    type: 'table' | 'view'
    source: string
  }
  dataBindings: DataBinding[]
}

export type WidgetKind = 'standard' | 'list-item'

export interface ColumnInfo {
  name: string
  type: string
}

// Versioned elements payload stored in ff_widgets.elements
// v1 (legacy): WidgetNode[]  — array with single root node
// v2 (current): this object
export interface WidgetElementsV2 {
  v: 2
  root: unknown           // WidgetNode — typed as unknown to avoid circular imports
  widgetKind: WidgetKind
  listItemMeta: ListItemMeta
}
