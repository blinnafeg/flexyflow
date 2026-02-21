<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects.store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LayoutGrid, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()

const projectId = route.params.id as string
const showCreate = ref(false)
const newName = ref('')
const creating = ref(false)

onMounted(async () => {
  await store.loadProjects()
  store.activeProjectId = projectId
  await store.loadLayouts(projectId)
})

async function createLayout() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const l = await store.createLayout(projectId, newName.value.trim())
    toast.success(`Макет «${l.name}» создан`)
    showCreate.value = false
    newName.value = ''
    router.push(`/layouts/${l.id}/edit`)
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    creating.value = false
  }
}

async function deleteLayout(id: string, name: string) {
  if (!confirm(`Удалить макет «${name}»?`)) return
  try {
    await store.deleteLayout(id)
    toast.success('Макет удалён')
  } catch (e: unknown) {
    toast.error((e as Error).message)
  }
}
</script>

<template>
  <div class="p-6 max-w-3xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <p class="text-sm text-muted-foreground mb-1">{{ store.activeProject?.name }}</p>
        <h1 class="text-2xl font-bold">Макеты</h1>
      </div>
      <Button @click="showCreate = true">
        <Plus class="size-4 mr-1" />
        Новый макет
      </Button>
    </div>

    <div v-if="store.loading" class="text-muted-foreground">Загрузка...</div>

    <div v-else-if="store.layouts.length === 0" class="border border-dashed rounded-lg p-10 text-center">
      <LayoutGrid class="size-10 mx-auto text-muted-foreground mb-3" />
      <p class="text-muted-foreground mb-3">Нет макетов</p>
      <Button @click="showCreate = true">
        <Plus class="size-4 mr-1" />
        Создать макет
      </Button>
    </div>

    <div v-else class="space-y-2">
      <Card v-for="l in store.layouts" :key="l.id" class="hover:bg-accent/30 transition-colors">
        <CardContent class="py-3 px-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <LayoutGrid class="size-4 text-muted-foreground" />
            <div>
              <p class="font-medium">{{ l.name }}</p>
              <p class="text-xs text-muted-foreground">
                {{ l.config.gridCols }}×{{ l.config.gridRows }} · {{ l.slots.length }} слотов
              </p>
            </div>
          </div>
          <div class="flex gap-1">
            <Button variant="ghost" size="icon-sm" @click="router.push(`/layouts/${l.id}/edit`)">
              <Pencil class="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" class="text-muted-foreground hover:text-destructive" @click="deleteLayout(l.id, l.name)">
              <Trash2 class="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create dialog -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showCreate = false">
      <div class="bg-background rounded-xl shadow-lg p-6 w-80 space-y-4">
        <h2 class="text-lg font-semibold">Новый макет</h2>
        <div>
          <Label class="text-sm">Название *</Label>
          <Input v-model="newName" class="mt-1" placeholder="Главный макет" @keyup.enter="createLayout" />
        </div>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" @click="showCreate = false">Отмена</Button>
          <Button :disabled="!newName.trim() || creating" @click="createLayout">
            {{ creating ? 'Создание...' : 'Создать' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
