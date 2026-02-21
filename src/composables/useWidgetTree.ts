import { nanoid } from 'nanoid'
import type { WidgetNode, WidgetType, WidgetNodeProps, RichTextSpan } from '@/types/widget-builder'

// ── Default node factory ──────────────────────────────────────────────────────

const EMPTY_SPACING = () => ({ top: 0, right: 0, bottom: 0, left: 0 })
const TRANSPARENT = 'transparent'

const DEFAULT_FLEX = (dir: 'row' | 'column') => ({
  direction: dir,
  alignItems: 'flex-start' as const,
  justifyContent: 'flex-start' as const,
  gap: 0,
  wrap: false,
})

const DEFAULT_TYPOGRAPHY = () => ({
  fontSize: 14,
  fontWeight: '400' as const,
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: 'left' as const,
})

const DEFAULT_BORDER = () => ({ width: 0, style: 'solid' as const, color: '#000000' })
const DEFAULT_RADIUS = () => ({ topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, linked: true })

const DEFAULT_RICH_SPANS = (): RichTextSpan[] => [
  { id: nanoid(8), text: 'Rich ', color: '#111827' },
  { id: nanoid(8), text: 'Text', color: '#3b82f6', fontWeight: '700' },
]

const DEFAULTS: Record<WidgetType, () => Partial<WidgetNodeProps>> = {
  ListView: () => ({
    width:  { value: 100, unit: '%' },
    height: { value: 0, unit: 'auto' },
    backgroundColor: TRANSPARENT,
    color: '#111827',
    listViewConfig: {
      dataSource: { type: 'table', source: '' },
      filters: [],
      sorting: [],
      pagination: { enabled: false, pageSize: 10 },
      listItemWidgetId: '',
    },
  }),
  Column: () => ({
    width:  { value: 100, unit: '%' },
    height: { value: 0, unit: 'auto' },
    flex: DEFAULT_FLEX('column'),
    backgroundColor: TRANSPARENT,
    color: '#111827',
  }),
  Row: () => ({
    width:  { value: 100, unit: '%' },
    height: { value: 0, unit: 'auto' },
    flex: DEFAULT_FLEX('row'),
    backgroundColor: TRANSPARENT,
    color: '#111827',
  }),
  Container: () => ({
    width:  { value: 100, unit: '%' },
    height: { value: 100, unit: 'px' },
    flex: DEFAULT_FLEX('column'),
    backgroundColor: TRANSPARENT,
    color: '#111827',
  }),
  Text: () => ({
    width:  { value: 0, unit: 'auto' },
    height: { value: 0, unit: 'auto' },
    backgroundColor: TRANSPARENT,
    color: '#111827',
    text: 'Text',
    typography: DEFAULT_TYPOGRAPHY(),
  }),
  Button: () => ({
    width:  { value: 0, unit: 'auto' },
    height: { value: 0, unit: 'auto' },
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    text: 'Button',
    padding: { top: 8, right: 16, bottom: 8, left: 16 },
    borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6, linked: true },
    typography: DEFAULT_TYPOGRAPHY(),
  }),
  TextField: () => ({
    width:  { value: 100, unit: '%' },
    height: { value: 0, unit: 'auto' },
    backgroundColor: '#ffffff',
    color: '#111827',
    placeholder: 'Enter text...',
    padding: { top: 8, right: 12, bottom: 8, left: 12 },
    border: { width: 1, style: 'solid', color: '#d1d5db' },
    borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6, linked: true },
    typography: DEFAULT_TYPOGRAPHY(),
  }),
  RichText: () => ({
    width:  { value: 0, unit: 'auto' },
    height: { value: 0, unit: 'auto' },
    backgroundColor: TRANSPARENT,
    color: '#111827',
    typography: DEFAULT_TYPOGRAPHY(),
    richSpans: DEFAULT_RICH_SPANS(),
  }),
}

export function createDefaultNode(type: WidgetType): WidgetNode {
  const specific = DEFAULTS[type]()
  const base: WidgetNodeProps = {
    width:  { value: 0, unit: 'auto' },
    height: { value: 0, unit: 'auto' },
    padding: EMPTY_SPACING(),
    margin: EMPTY_SPACING(),
    backgroundColor: TRANSPARENT,
    color: '#111827',
    opacity: 100,
    border: DEFAULT_BORDER(),
    borderRadius: DEFAULT_RADIUS(),
  }
  const props: WidgetNodeProps = { ...base, ...specific }
  if (!props.padding) props.padding = EMPTY_SPACING()
  if (!props.margin)  props.margin  = EMPTY_SPACING()
  return { id: nanoid(8), type, name: type, props, children: [] }
}

// ── Tree utilities ────────────────────────────────────────────────────────────

export function findNode(root: WidgetNode, id: string): WidgetNode | null {
  if (root.id === id) return root
  for (const child of root.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export function findParent(root: WidgetNode, id: string): WidgetNode | null {
  for (const child of root.children) {
    if (child.id === id) return root
    const found = findParent(child, id)
    if (found) return found
  }
  return null
}

export function removeNode(root: WidgetNode, id: string): boolean {
  const idx = root.children.findIndex(c => c.id === id)
  if (idx !== -1) { root.children.splice(idx, 1); return true }
  return root.children.some(c => removeNode(c, id))
}

export function canHaveChildren(type: WidgetType): boolean {
  return type === 'Column' || type === 'Row' || type === 'Container'
}

export function newRichSpan(): RichTextSpan {
  return { id: nanoid(8), text: 'Span' }
}

export function buildIndex(root: WidgetNode, map = new Map<string, WidgetNode>()): Map<string, WidgetNode> {
  map.set(root.id, root)
  root.children.forEach(c => buildIndex(c, map))
  return map
}
