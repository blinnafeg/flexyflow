<script setup lang="ts">
import { ref, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { usePaletteStore } from '@/stores/palette.store'
import type { PaletteColor } from '@/types/palette'
import { X, Palette } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  allowClear?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const palette = usePaletteStore()
const open = ref(false)

const isTransparent = computed(() =>
  !props.modelValue || props.modelValue === 'transparent'
)

const hexForPicker = computed(() =>
  isTransparent.value ? '#ffffff' : props.modelValue
)

function onNativePicker(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function pickPaletteColor(c: PaletteColor) {
  emit('update:modelValue', palette.resolveColor(c))
  open.value = false
}
</script>

<template>
  <div class="space-y-1">
    <!-- Input row -->
    <div class="flex items-center gap-1">
      <!-- Color swatch — acts as native color picker trigger -->
      <div
        class="size-7 shrink-0 rounded border border-border overflow-hidden relative cursor-pointer"
        :style="{ backgroundColor: modelValue || 'transparent' }"
      >
        <!-- Red slash for transparent/empty -->
        <svg
          v-if="isTransparent"
          class="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 28 28"
        >
          <line x1="3" y1="25" x2="25" y2="3" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <input
          type="color"
          :value="hexForPicker"
          class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          @input="onNativePicker"
        />
      </div>

      <!-- Hex text input -->
      <Input
        :model-value="modelValue"
        :placeholder="placeholder ?? 'transparent'"
        class="h-7 text-xs font-mono flex-1 min-w-0"
        @update:model-value="emit('update:modelValue', $event)"
      />

      <!-- Clear button -->
      <button
        v-if="allowClear && modelValue"
        class="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        title="Сбросить"
        @click="emit('update:modelValue', '')"
      >
        <X class="size-3.5" />
      </button>

      <!-- Palette toggle -->
      <button
        v-if="palette.groupedList.length > 0"
        class="shrink-0 rounded p-1 transition-colors"
        :class="open ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'"
        title="Палитра проекта"
        @click="open = !open"
      >
        <Palette class="size-3.5" />
      </button>
    </div>

    <!-- Palette swatches panel -->
    <div
      v-if="open && palette.groupedList.length > 0"
      class="rounded-md border bg-card shadow-sm p-2 space-y-2"
    >
      <!-- Theme mode toggle -->
      <div class="flex items-center justify-between pb-1 border-b">
        <span class="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Палитра</span>
        <div class="flex gap-0.5 bg-muted rounded p-0.5">
          <button
            class="text-[10px] px-2 py-0.5 rounded transition-colors"
            :class="palette.themeMode === 'light' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'"
            @click="palette.themeMode = 'light'"
          >Light</button>
          <button
            class="text-[10px] px-2 py-0.5 rounded transition-colors"
            :class="palette.themeMode === 'dark' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'"
            @click="palette.themeMode = 'dark'"
          >Dark</button>
        </div>
      </div>

      <div v-for="group in palette.groupedList" :key="group.key">
        <p class="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 font-medium">{{ group.label }}</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="c in group.colors"
            :key="c.id"
            class="size-6 rounded-sm border border-border/60 transition-all hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            :style="{ backgroundColor: palette.resolveColor(c) }"
            :title="c.name"
            @click="pickPaletteColor(c)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
