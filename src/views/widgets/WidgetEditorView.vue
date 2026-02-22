<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { usePaletteStore } from '@/stores/palette.store'
import WidgetTreePanel from '@/components/widget-builder/WidgetTreePanel.vue'
import WidgetCanvas   from '@/components/widget-builder/WidgetCanvas.vue'
import PropertiesPanel from '@/components/widget-builder/PropertiesPanel.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, Ruler, List } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route   = useRoute()
const router  = useRouter()
const store   = useWidgetBuilderStore()
const palette = usePaletteStore()

const widgetId = route.params.id as string
const loading  = ref(true)
const saving   = ref(false)

// ── Ruler ────────────────────────────────────────────────────────
const rulerEnabled = ref(false)
const canvasArea   = ref<HTMLElement | null>(null)
const canvasBox    = ref<HTMLElement | null>(null)

// linePos  — content-space coords (scroll-adjusted) for absolute line elements
// clientXY — raw client coords for the fixed-position badge
const linePos   = ref<{ x: number; y: number } | null>(null)
const clientXY  = ref<{ x: number; y: number } | null>(null)
const canvasPos = ref<{ x: number; y: number } | null>(null)

function onMouseMove(e: MouseEvent) {
  if (!rulerEnabled.value || !canvasArea.value) return
  const el = canvasArea.value
  const areaRect = el.getBoundingClientRect()
  // Content-space: add scroll offset so absolute lines follow cursor when scrolled
  linePos.value = {
    x: e.clientX - areaRect.left + el.scrollLeft,
    y: e.clientY - areaRect.top  + el.scrollTop,
  }
  // Raw client coords for the fixed badge
  clientXY.value = { x: e.clientX, y: e.clientY }
  if (canvasBox.value) {
    const boxRect = canvasBox.value.getBoundingClientRect()
    canvasPos.value = {
      x: Math.round((e.clientX - boxRect.left) / zoomNum.value),
      y: Math.round((e.clientY - boxRect.top)  / zoomNum.value),
    }
  }
}

function onMouseLeave() {
  linePos.value   = null
  clientXY.value  = null
  canvasPos.value = null
}

// ── Zoom ─────────────────────────────────────────────────────────
const zoom    = ref('1')
const zoomNum = computed(() => Number(zoom.value))

const canvasNaturalH = ref(0)
let ro: ResizeObserver | null = null

function attachRO() {
  if (!canvasBox.value) return
  ro = new ResizeObserver(entries => {
    canvasNaturalH.value = entries[0].contentRect.height
  })
  ro.observe(canvasBox.value)
}
function detachRO() {
  ro?.disconnect()
  ro = null
}

const scaledMarginBottom = computed(() => {
  if (zoomNum.value >= 1) return undefined
  const shrink = (1 - zoomNum.value) * canvasNaturalH.value
  return `-${shrink}px`
})

// Attach RO once canvasBox element is in DOM
watch(canvasBox, el => {
  detachRO()
  if (el) attachRO()
})

// ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    await store.load(widgetId)
    if (store.widget?.projectId) {
      palette.load(store.widget.projectId)
    }
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  detachRO()
  store.$reset()
})

async function handleSave() {
  saving.value = true
  try {
    await store.save()
    toast.success('Виджет сохранён')
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    saving.value = false
  }
}

function onKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
}
window.addEventListener('keydown', onKeyDown)
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-background">

    <!-- Toolbar -->
    <div class="flex items-center gap-2 px-4 h-11 border-b bg-card shrink-0">
      <Button variant="ghost" size="icon-sm" @click="router.back()">
        <ArrowLeft class="size-4" />
      </Button>

      <p class="text-sm font-medium flex-1 truncate">{{ store.widget?.name ?? '...' }}</p>

      <Badge v-if="store.isDirty" variant="secondary" class="text-xs shrink-0">Несохранено</Badge>

      <!-- List Item template toggle -->
      <Button
        variant="ghost"
        size="icon-sm"
        :class="store.widgetKind === 'list-item' ? 'bg-blue-500/15 text-blue-500' : ''"
        title="Шаблон списка (List Item)"
        @click="store.setWidgetKind(store.widgetKind === 'list-item' ? 'standard' : 'list-item')"
      >
        <List class="size-4" />
      </Button>

      <!-- Ruler toggle -->
      <Button
        variant="ghost"
        size="icon-sm"
        :class="rulerEnabled ? 'bg-accent text-accent-foreground' : ''"
        title="Линейка"
        @click="rulerEnabled = !rulerEnabled"
      >
        <Ruler class="size-4" />
      </Button>

      <!-- Zoom selector -->
      <Select v-model="zoom">
        <SelectTrigger class="h-7 w-[78px] text-xs shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.25">25%</SelectItem>
          <SelectItem value="0.5">50%</SelectItem>
          <SelectItem value="0.75">75%</SelectItem>
          <SelectItem value="1">100%</SelectItem>
          <SelectItem value="1.25">125%</SelectItem>
          <SelectItem value="1.5">150%</SelectItem>
          <SelectItem value="2">200%</SelectItem>
        </SelectContent>
      </Select>

      <Button size="sm" :disabled="saving || loading" @click="handleSave">
        <Loader2 v-if="saving" class="size-4 mr-1 animate-spin" />
        <Save v-else class="size-4 mr-1" />
        Сохранить
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center text-muted-foreground">
      Загрузка...
    </div>

    <!-- 3-column builder -->
    <div v-else class="flex flex-1 overflow-hidden">

      <!-- Left: Widget palette + Tree -->
      <aside class="w-56 border-r bg-card flex flex-col overflow-hidden shrink-0">
        <WidgetTreePanel />
      </aside>

      <!-- Center: Canvas -->
      <main
        ref="canvasArea"
        class="flex-1 overflow-auto relative"
        style="background-color: var(--canvas-bg)"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
      >
        <!-- Crosshair: direct absolute children of <main> so they aren't clipped.
             linePos uses scroll-adjusted coords so lines track the cursor correctly
             even when the canvas area is scrolled. -->
        <template v-if="rulerEnabled && linePos && clientXY">
          <!-- Horizontal line -->
          <div
            class="pointer-events-none absolute left-0 right-0 z-50"
            style="height:1px"
            :style="{ top: `${linePos.y}px`, background: 'rgba(34,211,238,0.6)' }"
          />
          <!-- Vertical line -->
          <div
            class="pointer-events-none absolute top-0 bottom-0 z-50"
            style="width:1px"
            :style="{ left: `${linePos.x}px`, background: 'rgba(34,211,238,0.6)' }"
          />
          <!-- Intersection dot -->
          <div
            class="pointer-events-none absolute z-50 rounded-full"
            style="width:6px;height:6px;transform:translate(-50%,-50%)"
            :style="{
              left: `${linePos.x}px`,
              top:  `${linePos.y}px`,
              background: 'rgba(34,211,238,1)',
            }"
          />
          <!-- Coordinate badge — fixed so it stays in the visible viewport area -->
          <div
            v-if="canvasPos && clientXY"
            class="pointer-events-none fixed z-[60] font-mono text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
            :style="{
              left: `${clientXY.x + 14}px`,
              top:  `${clientXY.y + 6}px`,
              background: 'rgba(0,0,0,0.8)',
              color: 'rgba(103,232,249,1)',
            }"
          >
            {{ canvasPos.x }}, {{ canvasPos.y }} px
          </div>
        </template>

        <!-- Zoom wrapper -->
        <div class="flex justify-center items-start p-8">
          <div
            ref="canvasBox"
            class="origin-top shrink-0"
            :style="{
              transform: `scale(${zoomNum})`,
              marginBottom: scaledMarginBottom,
            }"
          >
            <div class="bg-white shadow-2xl rounded-lg min-w-[360px] min-h-[200px]">
              <WidgetCanvas />
            </div>
          </div>
        </div>
      </main>

      <!-- Right: Properties -->
      <aside class="w-72 border-l bg-card flex flex-col overflow-hidden shrink-0">
        <PropertiesPanel />
      </aside>

    </div>
  </div>
</template>
