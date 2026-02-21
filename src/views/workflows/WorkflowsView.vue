<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Zap, GitBranch, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string

interface WorkflowRow {
  id: string; name: string; trigger: string
  steps: unknown[]; widget_id: string | null; page_id: string | null
}

const workflows = ref<WorkflowRow[]>([])
const loading = ref(true)
const showCreate = ref(false)
const newName = ref('')
const newTrigger = ref('onClick')
const creating = ref(false)

const triggerOptions = [
  { value: 'onClick',       label: 'onClick — клик' },
  { value: 'onSubmit',      label: 'onSubmit — отправка формы' },
  { value: 'onInit',        label: 'onInit — инициализация' },
  { value: 'onChange',      label: 'onChange — изменение значения' },
  { value: 'onHover',       label: 'onHover — наведение' },
  { value: 'onPageLoad',    label: 'onPageLoad — загрузка страницы' },
  { value: 'onWidgetMount', label: 'onWidgetMount — монтирование виджета' },
]

function stepLabel(n: number) {
  if (n === 1) return '1 шаг'
  if (n >= 2 && n <= 4) return `${n} шага`
  return `${n} шагов`
}

onMounted(() => load())

async function load() {
  loading.value = true
  const { data, error } = await supabase
    .from('ff_workflows')
    .select('id, name, trigger, steps, widget_id, page_id')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) toast.error(error.message)
  else workflows.value = data ?? []
  loading.value = false
}

async function createWorkflow() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const { data, error } = await supabase
      .from('ff_workflows')
      .insert({
        project_id: projectId,
        name: newName.value.trim(),
        trigger: newTrigger.value,
        steps: [],
        widget_id: null,
        page_id: null,
      })
      .select()
      .single()
    if (error) throw error
    toast.success(`Воркфлоу «${data.name}» создан`)
    showCreate.value = false
    newName.value = ''
    newTrigger.value = 'onClick'
    router.push(`/workflows/${data.id}`)
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    creating.value = false
  }
}

async function deleteWorkflow(id: string, name: string) {
  if (!confirm(`Удалить воркфлоу «${name}»?`)) return
  const { error } = await supabase.from('ff_workflows').delete().eq('id', id)
  if (error) toast.error(error.message)
  else { workflows.value = workflows.value.filter(w => w.id !== id); toast.success('Удалено') }
}
</script>

<template>
  <div class="p-6 max-w-3xl">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Воркфлоу</h1>
      <Button @click="showCreate = true">
        <Plus class="size-4 mr-1" /> Новый воркфлоу
      </Button>
    </div>

    <div v-if="loading" class="text-muted-foreground">Загрузка...</div>

    <div v-else-if="workflows.length === 0" class="border border-dashed rounded-lg p-10 text-center">
      <GitBranch class="size-10 mx-auto text-muted-foreground mb-3 opacity-40" />
      <p class="text-muted-foreground mb-3">Нет воркфлоу. Создайте первый.</p>
      <Button @click="showCreate = true"><Plus class="size-4 mr-1" /> Создать воркфлоу</Button>
    </div>

    <div v-else class="space-y-2">
      <Card
        v-for="w in workflows" :key="w.id"
        class="hover:bg-accent/30 transition-colors"
      >
        <CardContent class="py-3 px-4 flex items-center gap-3">
          <div
            class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            @click="router.push(`/workflows/${w.id}`)"
          >
            <div class="size-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
              <Zap class="size-4 text-blue-500" />
            </div>
            <div class="min-w-0">
              <p class="font-medium truncate">{{ w.name }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" class="text-[10px] py-0 px-1.5 font-mono">{{ w.trigger }}</Badge>
                <span class="text-xs text-muted-foreground">{{ stepLabel(w.steps.length) }}</span>
                <span v-if="w.widget_id" class="text-xs text-muted-foreground">· виджет</span>
                <span v-if="w.page_id"   class="text-xs text-muted-foreground">· страница</span>
              </div>
            </div>
          </div>
          <div class="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon-sm" @click="router.push(`/workflows/${w.id}`)">
              <Pencil class="size-4" />
            </Button>
            <Button
              variant="ghost" size="icon-sm"
              class="hover:text-destructive"
              @click="deleteWorkflow(w.id, w.name)"
            >
              <Trash2 class="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create dialog -->
    <div
      v-if="showCreate"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showCreate = false"
    >
      <div class="bg-background rounded-xl shadow-xl border p-6 w-96 space-y-4">
        <h2 class="text-lg font-semibold">Новый воркфлоу</h2>
        <div class="space-y-1.5">
          <Label>Название *</Label>
          <Input
            v-model="newName"
            placeholder="Обработчик клика..."
            @keyup.enter="createWorkflow"
          />
        </div>
        <div class="space-y-1.5">
          <Label>Триггер</Label>
          <Select v-model="newTrigger">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in triggerOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex gap-2 justify-end pt-1">
          <Button variant="outline" @click="showCreate = false">Отмена</Button>
          <Button :disabled="!newName.trim() || creating" @click="createWorkflow">
            {{ creating ? 'Создание...' : 'Создать' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
