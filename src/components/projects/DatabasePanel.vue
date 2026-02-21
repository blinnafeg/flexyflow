<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Project } from '@/types'
import { useProjectsStore } from '@/stores/projects.store'
import { DataSourceService } from '@/services/DataSourceService'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Database, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Table2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
  project: Project | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const store = useProjectsStore()

// ── Form state ────────────────────────────────────────────────────────────
const url     = ref('')
const anonKey = ref('')
const showKey = ref(false)

// ── Connection state ──────────────────────────────────────────────────────
const connecting = ref(false)
const tables     = ref<string[]>([])
const connected  = ref(false)
const connError  = ref<string | null>(null)

// Fill from project when panel opens
watch(() => props.open, (isOpen) => {
  if (isOpen && props.project) {
    url.value     = props.project.supabaseUrl
    anonKey.value = props.project.supabaseAnonKey
    connected.value  = !!(props.project.supabaseUrl && props.project.supabaseAnonKey)
    connError.value  = null
    tables.value     = []
    // If already connected — load tables immediately
    if (connected.value) loadTables()
  }
})

async function loadTables() {
  if (!url.value.trim() || !anonKey.value.trim()) return
  connecting.value = true
  connError.value  = null
  try {
    const ds = new DataSourceService({ url: url.value.trim(), anonKey: anonKey.value.trim() })
    tables.value = await ds.getTables()
    connected.value = true
  } catch (e: unknown) {
    connError.value = (e as Error).message
    connected.value = false
    tables.value    = []
  } finally {
    connecting.value = false
  }
}

async function connect() {
  if (!props.project) return
  await loadTables()
  if (connected.value) {
    try {
      await store.updateProjectDb(props.project.id, url.value.trim(), anonKey.value.trim())
      toast.success('База данных подключена')
    } catch (e: unknown) {
      toast.error((e as Error).message)
    }
  } else {
    toast.error(connError.value ?? 'Не удалось подключиться')
  }
}

function disconnect() {
  if (!props.project) return
  store.updateProjectDb(props.project.id, '', '')
    .then(() => {
      url.value = ''
      anonKey.value = ''
      tables.value = []
      connected.value = false
      toast.success('База данных отключена')
    })
    .catch((e: unknown) => toast.error((e as Error).message))
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent class="w-[480px] sm:max-w-[480px] flex flex-col gap-0 p-0">
      <SheetHeader class="px-6 pt-6 pb-4 border-b border-border shrink-0">
        <SheetTitle class="flex items-center gap-2">
          <Database class="size-4 text-purple-500" />
          База данных Supabase
        </SheetTitle>
        <SheetDescription>
          Подключите внешнюю Supabase к проекту. ListView будет получать данные из этой базы.
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        <!-- Connection form -->
        <div class="space-y-3">
          <!-- URL -->
          <div class="space-y-1.5">
            <Label class="text-xs">URL проекта Supabase</Label>
            <Input
              v-model="url"
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              class="h-8 text-sm font-mono"
            />
          </div>

          <!-- Anon key -->
          <div class="space-y-1.5">
            <Label class="text-xs">Anon Key (публичный ключ)</Label>
            <div class="relative">
              <Input
                v-model="anonKey"
                :type="showKey ? 'text' : 'password'"
                placeholder="eyJ..."
                class="h-8 text-sm font-mono pr-9"
              />
              <button
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                @click="showKey = !showKey"
              >
                <Eye v-if="!showKey" class="size-3.5" />
                <EyeOff v-else class="size-3.5" />
              </button>
            </div>
            <p class="text-[11px] text-muted-foreground">
              Anon key — публичный ключ, безопасен для хранения. Найди его в Supabase → Settings → API.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <Button
              class="flex-1 h-8 text-sm"
              :disabled="connecting || !url.trim() || !anonKey.trim()"
              @click="connect"
            >
              <Loader2 v-if="connecting" class="size-3.5 mr-2 animate-spin" />
              {{ connecting ? 'Подключение...' : 'Подключить' }}
            </Button>
            <Button
              v-if="connected"
              variant="outline"
              class="h-8 text-sm text-destructive hover:text-destructive"
              @click="disconnect"
            >
              Отключить
            </Button>
          </div>
        </div>

        <!-- Status -->
        <Separator />

        <div v-if="connected && tables.length > 0" class="space-y-3">
          <div class="flex items-center gap-2 text-sm">
            <CheckCircle2 class="size-4 text-green-500 shrink-0" />
            <span class="font-medium">Подключено</span>
            <span class="text-muted-foreground">· {{ tables.length }} таблиц</span>
          </div>

          <div>
            <p class="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-2 flex items-center gap-1.5">
              <Table2 class="size-3" />
              Доступные таблицы
            </p>
            <div class="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
              <Badge
                v-for="t in tables"
                :key="t"
                variant="secondary"
                class="text-[11px] font-mono cursor-default"
              >
                {{ t }}
              </Badge>
            </div>
          </div>
        </div>

        <div v-else-if="connError" class="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0 mt-0.5" />
          <span>{{ connError }}</span>
        </div>

        <div v-else-if="!url && !anonKey" class="text-sm text-muted-foreground">
          Введите URL и Anon Key вашего Supabase проекта, затем нажмите «Подключить».
        </div>

      </div>
    </SheetContent>
  </Sheet>
</template>
