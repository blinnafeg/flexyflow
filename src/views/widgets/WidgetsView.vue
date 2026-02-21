<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Puzzle, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string

interface WidgetRow { id: string; name: string; created_at: string }
const widgets = ref<WidgetRow[]>([])
const loading = ref(true)
const showCreate = ref(false)
const newName = ref('')
const creating = ref(false)

onMounted(() => load())

async function load() {
  loading.value = true
  const { data, error } = await supabase
    .from('ff_widgets')
    .select('id, name, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) toast.error(error.message)
  else widgets.value = data ?? []
  loading.value = false
}

async function createWidget() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const { data, error } = await supabase
      .from('ff_widgets')
      .insert({ project_id: projectId, name: newName.value.trim(), elements: [] })
      .select()
      .single()
    if (error) throw error
    toast.success(`Виджет «${data.name}» создан`)
    showCreate.value = false
    newName.value = ''
    router.push(`/widgets/${data.id}/edit`)
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    creating.value = false
  }
}

async function deleteWidget(id: string, name: string) {
  if (!confirm(`Удалить виджет «${name}»?`)) return
  const { error } = await supabase.from('ff_widgets').delete().eq('id', id)
  if (error) toast.error(error.message)
  else { widgets.value = widgets.value.filter(w => w.id !== id); toast.success('Удалено') }
}
</script>

<template>
  <div class="p-6 max-w-3xl">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Виджеты</h1>
      <Button @click="showCreate = true">
        <Plus class="size-4 mr-1" /> Новый виджет
      </Button>
    </div>

    <div v-if="loading" class="text-muted-foreground">Загрузка...</div>

    <div v-else-if="widgets.length === 0" class="border border-dashed rounded-lg p-10 text-center">
      <Puzzle class="size-10 mx-auto text-muted-foreground mb-3" />
      <p class="text-muted-foreground mb-3">Нет виджетов</p>
      <Button @click="showCreate = true"><Plus class="size-4 mr-1" /> Создать виджет</Button>
    </div>

    <div v-else class="space-y-2">
      <Card v-for="w in widgets" :key="w.id" class="hover:bg-accent/30 transition-colors">
        <CardContent class="py-3 px-4 flex items-center justify-between">
          <div class="flex items-center gap-3 cursor-pointer flex-1" @click="router.push(`/widgets/${w.id}/edit`)">
            <Puzzle class="size-4 text-muted-foreground" />
            <p class="font-medium">{{ w.name }}</p>
          </div>
          <div class="flex gap-1">
            <Button variant="ghost" size="icon-sm" @click="router.push(`/widgets/${w.id}/edit`)">
              <Pencil class="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" class="hover:text-destructive" @click="deleteWidget(w.id, w.name)">
              <Trash2 class="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create dialog -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showCreate = false">
      <div class="bg-background rounded-xl shadow-lg p-6 w-80 space-y-4">
        <h2 class="text-lg font-semibold">Новый виджет</h2>
        <div>
          <Label class="text-sm">Название *</Label>
          <Input v-model="newName" class="mt-1" placeholder="Header, Card, Hero..." @keyup.enter="createWidget" />
        </div>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" @click="showCreate = false">Отмена</Button>
          <Button :disabled="!newName.trim() || creating" @click="createWidget">
            {{ creating ? 'Создание...' : 'Создать' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
