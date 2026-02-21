export type WidgetType = 'Column' | 'Row' | 'Container' | 'Text' | 'Button' | 'TextField' | 'RichText' | 'ListView' | 'Icon'

export type SizeUnit = 'px' | '%' | 'auto'

export interface SizeValue {
  value: number
  unit: SizeUnit
}

export interface SpacingSide {
  top: number
  right: number
  bottom: number
  left: number
}

export interface BorderProps {
  width: number
  style: 'solid' | 'dashed' | 'dotted' | 'none'
  color: string
}

export interface BorderRadiusProps {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
  linked: boolean
}

export interface FlexProps {
  direction: 'row' | 'column'
  alignItems: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  gap: number
  wrap: boolean
}

export interface TypographyProps {
  fontSize: number
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800'
  lineHeight: number
  letterSpacing: number
  textAlign: 'left' | 'center' | 'right' | 'justify'
  fontFamily?: string  // Google Fonts family name, e.g. "Roboto"
}

// One styled span inside a RichText widget
export interface RichTextSpan {
  id: string
  text: string
  color?: string
  fontSize?: number
  fontWeight?: '300' | '400' | '500' | '600' | '700' | '800'
  fontFamily?: string
  italic?: boolean
  underline?: boolean
}

import type { ListViewConfig } from './list-view'

export interface WidgetNodeProps {
  // Sizing
  width: SizeValue
  height: SizeValue
  minWidth?: SizeValue
  minHeight?: SizeValue
  maxWidth?: SizeValue
  maxHeight?: SizeValue

  // Spacing
  padding: SpacingSide
  margin: SpacingSide

  // Colors
  backgroundColor: string
  color: string
  opacity: number  // 0–100

  // Border
  border: BorderProps
  borderRadius: BorderRadiusProps

  // Flex (Column / Row / Container)
  flex?: FlexProps

  // Typography (Text / Button / TextField / RichText)
  typography?: TypographyProps

  // Content
  text?: string           // Text, Button label
  placeholder?: string    // TextField
  richSpans?: RichTextSpan[]  // RichText spans

  // ListView-specific config (only for nodes of type 'ListView')
  listViewConfig?: ListViewConfig

  // Icon-specific (only for nodes of type 'Icon')
  iconName?: string         // e.g. 'Star'
  iconPackage?: string      // e.g. 'lucide'
  iconSize?: number         // px, e.g. 24
  iconColor?: string        // hex/css, '' = inherit currentColor from CSS
  iconStrokeWidth?: number  // Lucide stroke-width, default 2
}

export interface WidgetNode {
  id: string
  type: WidgetType
  name: string
  props: WidgetNodeProps
  children: WidgetNode[]
}

export interface WidgetDefinition {
  id: string
  projectId: string
  name: string
  root: WidgetNode
}
