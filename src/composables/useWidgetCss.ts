import type { WidgetNode, SizeValue } from '@/types/widget-builder'

function sz(v: SizeValue): string {
  if (v.unit === 'auto') return 'auto'
  return `${v.value}${v.unit}`
}

export function nodeToStyle(node: WidgetNode): Record<string, string> {
  const p = node.props
  const s: Record<string, string> = {}

  // Box model
  s.boxSizing = 'border-box'

  // Sizing
  s.width  = sz(p.width)
  s.height = sz(p.height)
  if (p.minWidth)  s.minWidth  = sz(p.minWidth)
  if (p.minHeight) s.minHeight = sz(p.minHeight)
  if (p.maxWidth)  s.maxWidth  = sz(p.maxWidth)
  if (p.maxHeight) s.maxHeight = sz(p.maxHeight)

  // Spacing
  s.padding = `${p.padding.top}px ${p.padding.right}px ${p.padding.bottom}px ${p.padding.left}px`
  const m = p.margin
  if (m.top || m.right || m.bottom || m.left) {
    s.margin = `${m.top}px ${m.right}px ${m.bottom}px ${m.left}px`
  }

  // Colors
  if (p.backgroundColor) s.backgroundColor = p.backgroundColor
  if (p.color) s.color = p.color
  if (p.opacity < 100) s.opacity = String(p.opacity / 100)

  // Border
  if (p.border.style !== 'none' && p.border.width > 0) {
    s.borderWidth = `${p.border.width}px`
    s.borderStyle = p.border.style
    s.borderColor = p.border.color
  }

  // Border radius
  const r = p.borderRadius
  if (r.linked) {
    s.borderRadius = `${r.topLeft}px`
  } else {
    s.borderRadius = `${r.topLeft}px ${r.topRight}px ${r.bottomRight}px ${r.bottomLeft}px`
  }

  // Flex
  if (p.flex && ['Column', 'Row', 'Container'].includes(node.type)) {
    s.display         = 'flex'
    s.flexDirection   = p.flex.direction
    s.alignItems      = p.flex.alignItems
    s.justifyContent  = p.flex.justifyContent
    s.gap             = `${p.flex.gap}px`
    s.flexWrap        = p.flex.wrap ? 'wrap' : 'nowrap'
  }

  // Typography
  if (p.typography) {
    s.fontSize      = `${p.typography.fontSize}px`
    s.fontWeight    = p.typography.fontWeight
    s.lineHeight    = `${p.typography.lineHeight}`
    s.letterSpacing = `${p.typography.letterSpacing}px`
    s.textAlign     = p.typography.textAlign
    if (p.typography.fontFamily) {
      s.fontFamily = `"${p.typography.fontFamily}", sans-serif`
    }
  }

  return s
}
