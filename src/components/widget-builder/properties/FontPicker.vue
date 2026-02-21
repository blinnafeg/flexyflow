<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { GOOGLE_FONTS, loadGoogleFont } from '@/composables/useGoogleFonts'

const props = defineProps<{
  modelValue?: string  // current font family or undefined = system default
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const search = ref('')
const open = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const filtered = computed(() =>
  GOOGLE_FONTS.filter(f =>
    f.toLowerCase().includes(search.value.toLowerCase())
  )
)

function selectFont(family: string | undefined) {
  if (family) loadGoogleFont(family)
  emit('update:modelValue', family)
  open.value = false
  search.value = ''
}

function onOpen() {
  open.value = true
  // Load the selected font if there is one
  if (props.modelValue) loadGoogleFont(props.modelValue)
}

// Load font preview on hover
function onHoverFont(family: string) {
  loadGoogleFont(family)
}

// Close on outside click
function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
    search.value = ''
  }
}
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))

// Ensure selected font is loaded on mount
onMounted(() => { if (props.modelValue) loadGoogleFont(props.modelValue) })
</script>

<template>
  <div ref="containerRef" class="relative">
    <!-- Trigger -->
    <button
      type="button"
      class="w-full h-7 px-2 text-xs text-left rounded border border-input bg-background hover:bg-accent flex items-center justify-between gap-1 transition-colors"
      :style="modelValue ? { fontFamily: `'${modelValue}', sans-serif` } : {}"
      @click="onOpen"
    >
      <span class="truncate">{{ modelValue ?? 'Системный шрифт' }}</span>
      <svg class="size-3 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <div
      v-if="open"
      class="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg overflow-hidden"
    >
      <!-- Search -->
      <div class="p-1.5 border-b">
        <input
          v-model="search"
          class="w-full h-6 text-xs px-2 rounded bg-muted outline-none placeholder:text-muted-foreground"
          placeholder="Поиск шрифта..."
          autofocus
        />
      </div>

      <!-- Font list -->
      <div class="max-h-48 overflow-y-auto">
        <!-- System default -->
        <button
          type="button"
          class="w-full px-2.5 py-1.5 text-xs text-left hover:bg-accent transition-colors flex items-center justify-between"
          :class="!modelValue ? 'bg-accent/50 font-medium' : ''"
          @click="selectFont(undefined)"
        >
          Системный шрифт
          <span v-if="!modelValue" class="text-primary text-[10px]">✓</span>
        </button>

        <button
          v-for="family in filtered"
          :key="family"
          type="button"
          class="w-full px-2.5 py-1.5 text-xs text-left hover:bg-accent transition-colors flex items-center justify-between"
          :class="modelValue === family ? 'bg-accent/50' : ''"
          :style="{ fontFamily: `'${family}', sans-serif` }"
          @mouseenter="onHoverFont(family)"
          @click="selectFont(family)"
        >
          {{ family }}
          <span v-if="modelValue === family" class="text-primary text-[10px]">✓</span>
        </button>

        <p v-if="filtered.length === 0" class="px-2.5 py-2 text-xs text-muted-foreground">
          Ничего не найдено
        </p>
      </div>
    </div>
  </div>
</template>
