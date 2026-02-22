<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePaletteStore } from '@/stores/palette.store'
import type { ColorGroup } from '@/types/palette'
import { COLOR_GROUPS, COLOR_GROUP_LABELS } from '@/types/palette'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Plus, Trash2, Save, Loader2, Sun, Moon, Palette } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route  = useRoute()
const router = useRouter()
const palette = usePaletteStore()
const projectId = route.params.id as string

const loading = ref(true)
const saving  = ref(false)
const editingId = ref<string | null>(null)

function isLight(hex: string): boolean {
  const c = hex.replace('#', '')
  if (c.length !== 6) return true
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

onMounted(async () => {
  palette.reset()
  await palette.load(projectId)
  loading.value = false
})

async function save() {
  saving.value = true
  const ok = await palette.save()
  saving.value = false
  if (ok) toast.success('Палитра сохранена')
  else toast.error(palette.saveError ?? 'Ошибка сохранения')
}

function toggleEdit(id: string) {
  editingId.value = editingId.value === id ? null : id
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">

    <!-- Toolbar -->
    <div class="flex items-center gap-3 px-4 py-2.5 border-b bg-card shrink-0">
      <Button variant="ghost" size="icon-sm" @click="router.back()">
        <ArrowLeft class="size-4" />
      </Button>
      <div class="flex items-center gap-2 flex-1">
        <Palette class="size-4 text-primary" />
        <h1 class="text-sm font-semibold">Цвета проекта</h1>
      </div>

      <!-- Light / Dark preview toggle -->
      <div class="flex items-center gap-1 bg-muted rounded-md p-0.5">
        <button
          class="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors"
          :class="palette.themeMode === 'light' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'"
          @click="palette.themeMode = 'light'"
        >
          <Sun class="size-3" /> Light
        </button>
        <button
          class="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors"
          :class="palette.themeMode === 'dark' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'"
          @click="palette.themeMode = 'dark'"
        >
          <Moon class="size-3" /> Dark
        </button>
      </div>

      <Button :disabled="saving" @click="save">
        <Loader2 v-if="saving" class="size-4 mr-1.5 animate-spin" />
        <Save v-else class="size-4 mr-1.5" />
        Сохранить
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center text-muted-foreground">
      Загрузка...
    </div>

    <!-- Content -->
    <div v-else class="flex-1 overflow-y-auto">
      <div class="p-6 max-w-5xl">

        <!-- Migration notice if save fails -->
        <div v-if="palette.saveError" class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <p class="font-semibold text-amber-700 dark:text-amber-400 mb-2">Требуется миграция БД</p>
          <p class="text-muted-foreground mb-3">
            Добавьте колонку <code class="bg-muted px-1 rounded font-mono text-xs">color_palette</code>
            в таблицу <code class="bg-muted px-1 rounded font-mono text-xs">ff_projects</code> через Supabase SQL Editor:
          </p>
          <pre class="bg-muted rounded p-3 text-xs font-mono overflow-x-auto">ALTER TABLE ff_projects ADD COLUMN IF NOT EXISTS color_palette jsonb;</pre>
        </div>

        <!-- Description -->
        <p class="text-sm text-muted-foreground mb-6">
          Определите цвета проекта — они будут доступны во всех пикерах виджет-билдера и редактора страниц.
          Каждый цвет имеет значение для светлой и тёмной темы.
        </p>

        <!-- Color groups -->
        <div class="space-y-10">
          <div v-for="groupKey in COLOR_GROUPS" :key="groupKey">

            <!-- Group header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <h2 class="text-base font-semibold">{{ COLOR_GROUP_LABELS[groupKey] }}</h2>
                <Badge variant="secondary" class="text-xs">
                  {{ palette.grouped[groupKey].length }}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="palette.addColor(groupKey as ColorGroup)"
              >
                <Plus class="size-3.5 mr-1" />
                Добавить
              </Button>
            </div>

            <!-- Empty group -->
            <div
              v-if="palette.grouped[groupKey].length === 0"
              class="border border-dashed rounded-xl p-8 text-center text-muted-foreground text-sm"
            >
              Нет цветов. Нажмите «Добавить».
            </div>

            <!-- Color cards grid -->
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div
                v-for="color in palette.grouped[groupKey]"
                :key="color.id"
                class="border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow cursor-pointer"
                @click="toggleEdit(color.id)"
              >
                <!-- Swatch area: light + dark side by side -->
                <div class="flex h-20">
                  <div
                    class="flex-1 relative"
                    :style="{ backgroundColor: color.light }"
                    title="Light"
                  >
                    <span class="absolute bottom-1 left-1.5 text-[9px] font-mono opacity-60 select-none"
                      :style="{ color: isLight(color.light) ? '#000' : '#fff' }">L</span>
                  </div>
                  <div
                    class="flex-1 relative"
                    :style="{ backgroundColor: color.dark }"
                    title="Dark"
                  >
                    <span class="absolute bottom-1 right-1.5 text-[9px] font-mono opacity-60 select-none"
                      :style="{ color: isLight(color.dark) ? '#000' : '#fff' }">D</span>
                  </div>
                </div>

                <!-- Name + hex -->
                <div class="px-3 py-2">
                  <p class="text-xs font-semibold truncate">{{ color.name }}</p>
                  <p class="text-[10px] font-mono text-muted-foreground truncate">
                    {{ palette.themeMode === 'light' ? color.light : color.dark }}
                  </p>
                </div>

                <!-- Inline editor (expanded when editing) -->
                <div
                  v-if="editingId === color.id"
                  class="border-t p-3 space-y-2 bg-muted/20"
                  @click.stop
                >
                  <!-- Name -->
                  <div>
                    <label class="text-[10px] text-muted-foreground uppercase tracking-wider">Название</label>
                    <Input
                      :model-value="color.name"
                      class="h-7 text-xs mt-0.5"
                      @update:model-value="palette.updateColor(color.id, { name: $event })"
                    />
                  </div>

                  <!-- Light value -->
                  <div>
                    <label class="text-[10px] text-muted-foreground uppercase tracking-wider">Light</label>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <div
                        class="size-7 rounded border border-border shrink-0 overflow-hidden relative cursor-pointer"
                        :style="{ backgroundColor: color.light }"
                      >
                        <input
                          type="color"
                          :value="color.light"
                          class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          @input="palette.updateColor(color.id, { light: ($event.target as HTMLInputElement).value })"
                        />
                      </div>
                      <Input
                        :model-value="color.light"
                        class="h-7 text-xs font-mono flex-1"
                        @update:model-value="palette.updateColor(color.id, { light: $event })"
                      />
                    </div>
                  </div>

                  <!-- Dark value -->
                  <div>
                    <label class="text-[10px] text-muted-foreground uppercase tracking-wider">Dark</label>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <div
                        class="size-7 rounded border border-border shrink-0 overflow-hidden relative cursor-pointer"
                        :style="{ backgroundColor: color.dark }"
                      >
                        <input
                          type="color"
                          :value="color.dark"
                          class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          @input="palette.updateColor(color.id, { dark: ($event.target as HTMLInputElement).value })"
                        />
                      </div>
                      <Input
                        :model-value="color.dark"
                        class="h-7 text-xs font-mono flex-1"
                        @update:model-value="palette.updateColor(color.id, { dark: $event })"
                      />
                    </div>
                  </div>

                  <!-- Delete -->
                  <Button
                    variant="destructive"
                    size="sm"
                    class="w-full h-7 text-xs"
                    @click="palette.removeColor(color.id); editingId = null"
                  >
                    <Trash2 class="size-3 mr-1" /> Удалить
                  </Button>
                </div>
              </div>
            </div>

            <Separator v-if="groupKey !== COLOR_GROUPS[COLOR_GROUPS.length - 1]" class="mt-8" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
