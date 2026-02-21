<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Plus } from 'lucide-vue-next'
import { iconPackages } from '@/registry/icon-packages'
import type { Component } from 'vue'

const props = defineProps<{
  modelValue: boolean
  selectedPackage?: string
  selectedIcon?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [packageId: string, iconName: string]
}>()

const search = ref('')
const activePackageId = ref(props.selectedPackage ?? iconPackages[0]?.id ?? 'lucide')

watch(() => props.selectedPackage, (v) => { if (v) activePackageId.value = v })
watch(() => props.modelValue, (open) => { if (open) search.value = '' })

const activePackage = computed(() =>
  iconPackages.find(p => p.id === activePackageId.value) ?? iconPackages[0]
)

const allIconNames = computed(() =>
  activePackage.value ? Object.keys(activePackage.value.icons) : []
)

const filteredIconNames = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allIconNames.value
  return allIconNames.value.filter(n => n.toLowerCase().includes(q))
})

function getIcon(name: string): Component | undefined {
  return activePackage.value?.icons[name]
}

function selectIcon(iconName: string) {
  emit('select', activePackageId.value, iconName)
  emit('update:modelValue', false)
}
</script>

<template>
  <Sheet :open="modelValue" @update:open="emit('update:modelValue', $event)">
    <SheetContent side="right" class="p-0 gap-0 flex flex-col w-[680px] max-w-[90vw]">
      <SheetHeader class="px-4 py-3 border-b shrink-0">
        <SheetTitle class="text-sm font-semibold">Выбор иконки</SheetTitle>
      </SheetHeader>

      <div class="flex flex-1 overflow-hidden min-h-0">
        <!-- Левая панель: поиск + список пакетов -->
        <div class="w-48 border-r flex flex-col shrink-0 bg-muted/20">
          <!-- Поиск -->
          <div class="p-2.5 border-b">
            <div class="relative">
              <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                v-model="search"
                placeholder="Поиск иконок..."
                class="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          <!-- Список пакетов -->
          <ScrollArea class="flex-1">
            <div class="p-2 space-y-0.5">
              <p class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                Пакеты иконок
              </p>
              <button
                v-for="pkg in iconPackages"
                :key="pkg.id"
                class="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-colors"
                :class="pkg.id === activePackageId
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-accent text-foreground'"
                @click="activePackageId = pkg.id; search = ''"
              >
                <span class="flex-1 truncate">{{ pkg.name }}</span>
                <span class="text-[10px] tabular-nums shrink-0 opacity-70">
                  {{ Object.keys(pkg.icons).length }}
                </span>
              </button>
            </div>
          </ScrollArea>

          <!-- Кнопка добавления пакета -->
          <div class="p-2 border-t shrink-0">
            <div
              class="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs text-muted-foreground cursor-default"
              title="Чтобы добавить пакет: установите npm-пакет и зарегистрируйте его в src/registry/icon-packages.ts"
            >
              <Plus class="size-3.5 shrink-0" />
              <span>Добавить пакет</span>
            </div>
          </div>
        </div>

        <!-- Правая панель: сетка иконок -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Статус -->
          <div class="px-3 py-2 border-b shrink-0 flex items-center gap-2">
            <span class="text-[11px] text-muted-foreground">
              {{ filteredIconNames.length.toLocaleString() }} иконок
              <template v-if="search"> · «{{ search }}»</template>
            </span>
            <span v-if="selectedIcon && !search" class="ml-auto text-[11px] text-blue-500 font-mono truncate max-w-[180px]">
              ✓ {{ selectedIcon }}
            </span>
          </div>

          <ScrollArea class="flex-1">
            <div class="p-2">
              <!-- Сетка -->
              <div class="grid gap-0.5" style="grid-template-columns: repeat(auto-fill, minmax(56px, 1fr))">
                <button
                  v-for="name in filteredIconNames"
                  :key="name"
                  class="flex flex-col items-center justify-center gap-1 p-1.5 rounded-md transition-colors cursor-pointer min-w-0"
                  :class="name === selectedIcon && activePackageId === selectedPackage
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                    : 'hover:bg-accent text-foreground'"
                  :title="name"
                  @click="selectIcon(name)"
                >
                  <component
                    :is="getIcon(name)"
                    :size="18"
                    class="shrink-0"
                  />
                  <span class="text-[9px] leading-tight w-full text-center truncate px-0.5">
                    {{ name }}
                  </span>
                </button>
              </div>

              <!-- Пусто -->
              <div
                v-if="filteredIconNames.length === 0"
                class="flex flex-col items-center justify-center py-20 text-muted-foreground"
              >
                <Search class="size-10 mb-3 opacity-20" />
                <p class="text-sm font-medium">Иконок не найдено</p>
                <p class="text-xs mt-1 opacity-70">Попробуйте другой запрос</p>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
