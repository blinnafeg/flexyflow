export type ColorGroup = 'brand' | 'accent' | 'semantic' | 'neutral'

export interface PaletteColor {
  id: string
  name: string
  group: ColorGroup
  light: string // hex
  dark: string  // hex
}

export const COLOR_GROUP_LABELS: Record<ColorGroup, string> = {
  brand:    'Brand',
  accent:   'Accent',
  semantic: 'Semantic',
  neutral:  'Neutral',
}

export const COLOR_GROUPS: ColorGroup[] = ['brand', 'accent', 'semantic', 'neutral']

export const DEFAULT_PALETTE: PaletteColor[] = [
  { id: 'primary',        name: 'Primary',        group: 'brand',    light: '#3b82f6', dark: '#60a5fa' },
  { id: 'secondary',      name: 'Secondary',      group: 'brand',    light: '#8b5cf6', dark: '#a78bfa' },
  { id: 'tertiary',       name: 'Tertiary',        group: 'brand',    light: '#ec4899', dark: '#f472b6' },
  { id: 'accent1',        name: 'Accent 1',        group: 'accent',   light: '#f59e0b', dark: '#fbbf24' },
  { id: 'accent2',        name: 'Accent 2',        group: 'accent',   light: '#14b8a6', dark: '#2dd4bf' },
  { id: 'success',        name: 'Success',         group: 'semantic', light: '#22c55e', dark: '#4ade80' },
  { id: 'error',          name: 'Error',           group: 'semantic', light: '#ef4444', dark: '#f87171' },
  { id: 'warning',        name: 'Warning',         group: 'semantic', light: '#f59e0b', dark: '#fbbf24' },
  { id: 'info',           name: 'Info',            group: 'semantic', light: '#0ea5e9', dark: '#38bdf8' },
  { id: 'background',     name: 'Background',      group: 'neutral',  light: '#ffffff', dark: '#0f172a' },
  { id: 'surface',        name: 'Surface',         group: 'neutral',  light: '#f8fafc', dark: '#1e293b' },
  { id: 'text-primary',   name: 'Primary Text',    group: 'neutral',  light: '#111827', dark: '#f9fafb' },
  { id: 'text-secondary', name: 'Secondary Text',  group: 'neutral',  light: '#6b7280', dark: '#9ca3af' },
]
