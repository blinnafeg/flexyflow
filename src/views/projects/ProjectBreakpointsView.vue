<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreakpointsStore } from '@/stores/breakpoints.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Loader2, Smartphone, Tablet, Monitor } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { BreakpointId } from '@/types/breakpoints'

const route  = useRoute()
const router = useRouter()
const bpStore = useBreakpointsStore()
const projectId = route.params.id as string

const loading = ref(true)
const saving  = ref(false)

const BP_ICONS: Record<BreakpointId, typeof Smartphone> = {
  mobile:          Smartphone,
  tablet:          Tablet,
  tabletLandscape: Tablet,
  desktop:         Monitor,
}

// Local editable copies of minWidth values (all except mobile which is always 0)
const editableMinWidths = ref<Record<string, number>>({})

onMounted(async () => {
  await bpStore.load(projectId)
  for (const bp of bpStore.breakpoints) {
    editableMinWidths.value[bp.id] = bp.minWidth
  }
  loading.value = false
})

/** The 3 configurable boundaries: tablet, tabletLandscape, desktop */
const configurableBps = computed(() =>
  bpStore.breakpoints.filter(b => b.id !== 'mobile')
)

function clampAndUpdate(id: BreakpointId, raw: string) {
  const val = parseInt(raw, 10)
  if (isNaN(val) || val < 1) return
  editableMinWidths.value[id] = val
}

async function handleSave() {
  // Validate: each boundary must be strictly greater than the previous
  const ids: BreakpointId[] = ['tablet', 'tabletLandscape', 'desktop']
  let prev = 0
  for (const id of ids) {
    const v = editableMinWidths.value[id] ?? 0
    if (v <= prev) {
      toast.error(`Граница "${id}" должна быть больше предыдущей (${prev}px)`)
      return
    }
    prev = v
  }

  // Apply to store
  for (const id of ids) {
    bpStore.updateMinWidth(id, editableMinWidths.value[id])
  }

  saving.value = true
  const ok = await bpStore.save()
  saving.value = false
  if (ok) toast.success('Брейкпоинты сохранены')
  else toast.error('Ошибка сохранения')
}

/** Width px of the visual ruler track */
const TRACK_MAX = 991 // desktop starts at 991, so we show 0–991+ range

function posPercent(minWidth: number): string {
  // Clamp to 0–100% relative to TRACK_MAX
  return Math.min(100, (minWidth / TRACK_MAX) * 100).toFixed(1) + '%'
}
</script>

<template>
  <div class="p-6 max-w-2xl">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <Button variant="ghost" size="icon-sm" @click="router.back()">
        <ArrowLeft class="size-4" />
      </Button>
      <div>
        <h1 class="text-xl font-bold">Брейкпоинты</h1>
        <p class="text-sm text-muted-foreground">Настройте границы адаптивных размеров экрана</p>
      </div>
    </div>

    <div v-if="loading" class="text-muted-foreground text-sm">Загрузка...</div>

    <template v-else>
      <!-- Visual breakpoint ruler -->
      <div class="mb-8 bg-card border rounded-xl p-5">
        <p class="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-4">Шкала</p>

        <!-- Device icons + labels -->
        <div class="relative flex items-end mb-2" style="height: 48px;">
          <div
            v-for="bp in bpStore.breakpoints"
            :key="bp.id"
            class="absolute flex flex-col items-center gap-0.5"
            :style="{ left: bp.id === 'desktop' ? 'auto' : posPercent(bp.minWidth), right: bp.id === 'desktop' ? '0' : 'auto', transform: bp.id === 'desktop' ? 'none' : 'translateX(-50%)' }"
          >
            <component :is="BP_ICONS[bp.id]" class="size-4 text-muted-foreground" />
            <span class="text-[10px] text-muted-foreground whitespace-nowrap">{{ bp.label }}</span>
          </div>
        </div>

        <!-- Track -->
        <div class="relative h-2 bg-muted rounded-full">
          <div
            v-for="(bp, i) in bpStore.breakpoints"
            :key="bp.id"
            class="absolute h-full rounded-full"
            :class="['bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary'][i]"
            :style="{
              left: posPercent(bp.minWidth),
              right: i < bpStore.breakpoints.length - 1 ? `calc(100% - ${posPercent(bpStore.breakpoints[i + 1].minWidth)})` : '0',
            }"
          />
          <!-- Tick marks -->
          <div
            v-for="bp in configurableBps"
            :key="bp.id + '-tick'"
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"
            :style="{ left: posPercent(bp.minWidth) }"
          />
        </div>

        <!-- Min labels -->
        <div class="relative mt-1" style="height: 16px;">
          <span class="absolute left-0 text-[10px] text-muted-foreground">0</span>
          <span
            v-for="bp in configurableBps"
            :key="bp.id + '-label'"
            class="absolute text-[10px] text-muted-foreground -translate-x-1/2"
            :style="{ left: posPercent(bp.minWidth) }"
          >{{ bp.minWidth }}</span>
          <span class="absolute right-0 text-[10px] text-muted-foreground">∞</span>
        </div>
      </div>

      <!-- Editable boundaries -->
      <div class="space-y-3 mb-8">
        <p class="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Границы (px)</p>
        <p class="text-xs text-muted-foreground -mt-1">
          Минимальная ширина экрана, при которой активируется брейкпоинт
        </p>

        <div
          v-for="bp in configurableBps"
          :key="bp.id"
          class="flex items-center gap-3"
        >
          <div class="flex items-center gap-2 w-44">
            <component :is="BP_ICONS[bp.id]" class="size-4 text-muted-foreground shrink-0" />
            <span class="text-sm font-medium">{{ bp.label }}</span>
          </div>
          <Input
            type="number"
            min="1"
            :model-value="editableMinWidths[bp.id]"
            class="w-28 h-8 text-sm font-mono"
            @update:model-value="clampAndUpdate(bp.id, String($event))"
          />
          <span class="text-xs text-muted-foreground">px и выше</span>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 w-44">
            <Smartphone class="size-4 text-muted-foreground shrink-0" />
            <span class="text-sm font-medium">Mobile</span>
          </div>
          <div class="w-28 h-8 flex items-center px-3 bg-muted rounded-md">
            <span class="text-sm font-mono text-muted-foreground">0</span>
          </div>
          <span class="text-xs text-muted-foreground">всегда (минимум)</span>
        </div>
      </div>

      <!-- Migration hint -->
      <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 text-xs">
        <p class="font-semibold text-amber-800 dark:text-amber-400 mb-1">Требуется миграция БД</p>
        <p class="text-amber-700 dark:text-amber-500 mb-2">Добавьте колонку в Supabase SQL Editor:</p>
        <code class="block bg-amber-100 dark:bg-amber-900/40 rounded px-3 py-2 font-mono text-amber-900 dark:text-amber-300">
          ALTER TABLE ff_projects ADD COLUMN IF NOT EXISTS breakpoints jsonb;
        </code>
      </div>

      <!-- Save -->
      <Button :disabled="saving" @click="handleSave">
        <Loader2 v-if="saving" class="size-4 mr-1.5 animate-spin" />
        <Save v-else class="size-4 mr-1.5" />
        Сохранить
      </Button>
    </template>
  </div>
</template>
