export type BreakpointId = 'mobile' | 'tablet' | 'tabletLandscape' | 'desktop'

export interface Breakpoint {
  id: BreakpointId
  label: string
  minWidth: number    // viewport width >= minWidth → this breakpoint applies
  canvasWidth: number // canvas width in the editor for this breakpoint
}

export const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { id: 'mobile',          label: 'Mobile',            minWidth: 0,   canvasWidth: 390  },
  { id: 'tablet',          label: 'Tablet',            minWidth: 479, canvasWidth: 768  },
  { id: 'tabletLandscape', label: 'Tablet (landscape)', minWidth: 767, canvasWidth: 1024 },
  { id: 'desktop',         label: 'Desktop',           minWidth: 991, canvasWidth: 1440 },
]
