<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects.store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Plus, Trash2, FolderOpen } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const store = useProjectsStore()
const router = useRouter()

const showCreate = ref(false)
const newName = ref('')
const newDesc = ref('')
const creating = ref(false)

onMounted(() => store.loadProjects())

async function createProject() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const p = await store.createProject(newName.value.trim(), newDesc.value.trim() || undefined)
    toast.success(`Проект «${p.name}» создан`)
    showCreate.value = false
    newName.value = ''
    newDesc.value = ''
    router.push(`/projects/${p.id}`)
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    creating.value = false
  }
}

async function deleteProject(id: string, name: string) {
  if (!confirm(`Удалить проект «${name}»?`)) return
  try {
    await store.deleteProject(id)
    toast.success('Проект удалён')
  } catch (e: unknown) {
    toast.error((e as Error).message)
  }
}
</script>

<template>
  <div class="p-6 max-w-3xl">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Проекты</h1>
      <Button @click="showCreate = true">
        <Plus class="size-4 mr-1" />
        Новый проект
      </Button>
    </div>

    <div v-if="store.loading" class="text-muted-foreground">Загрузка...</div>

    <div v-else-if="store.projects.length === 0" class="border border-dashed rounded-lg p-10 text-center">
      <FolderOpen class="size-10 mx-auto text-muted-foreground mb-3" />
      <p class="text-muted-foreground mb-3">Нет проектов</p>
      <Button @click="showCreate = true">
        <Plus class="size-4 mr-1" />
        Создать первый проект
      </Button>
    </div>

    <div v-else class="space-y-2">
      <Card
        v-for="p in store.projects"
        :key="p.id"
        class="hover:bg-accent/30 transition-colors"
      >
        <CardContent class="py-3 px-4 flex items-center justify-between">
          <div
            class="flex-1 cursor-pointer"
            @click="router.push(`/projects/${p.id}`)"
          >
            <p class="font-medium">{{ p.name }}</p>
            <p v-if="p.description" class="text-xs text-muted-foreground">{{ p.description }}</p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              class="text-muted-foreground hover:text-destructive"
              @click.stop="deleteProject(p.id, p.name)"
            >
              <Trash2 class="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              @click="router.push(`/projects/${p.id}`)"
            >
              <ArrowRight class="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create dialog -->
    <div
      v-if="showCreate"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="showCreate = false"
    >
      <div class="bg-background rounded-xl shadow-lg p-6 w-96 space-y-4">
        <h2 class="text-lg font-semibold">Новый проект</h2>
        <div>
          <Label class="text-sm">Название *</Label>
          <Input v-model="newName" class="mt-1" placeholder="Мой сайт" @keyup.enter="createProject" />
        </div>
        <div>
          <Label class="text-sm">Описание</Label>
          <Input v-model="newDesc" class="mt-1" placeholder="Необязательно" />
        </div>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" @click="showCreate = false">Отмена</Button>
          <Button :disabled="!newName.trim() || creating" @click="createProject">
            {{ creating ? 'Создание...' : 'Создать' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
