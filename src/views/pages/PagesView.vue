<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects.store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Pencil, Trash2, Globe } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()

const projectId = route.params.id as string
const showCreate = ref(false)
const newName = ref('')
const newSlug = ref('')
const creating = ref(false)

onMounted(async () => {
  await store.loadProjects()
  store.activeProjectId = projectId
  await store.loadPages(projectId)
})

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function onNameInput() {
  newSlug.value = slugify(newName.value)
}

async function createPage() {
  if (!newName.value.trim() || !newSlug.value.trim()) return
  creating.value = true
  try {
    const p = await store.createPage(projectId, newName.value.trim(), newSlug.value.trim())
    toast.success(`Страница «${p.name}» создана`)
    showCreate.value = false
    newName.value = ''
    newSlug.value = ''
    router.push(`/pages/${p.id}/edit`)
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    creating.value = false
  }
}

async function deletePage(id: string, name: string) {
  if (!confirm(`Удалить страницу «${name}»?`)) return
  try {
    await store.deletePage(id)
    toast.success('Страница удалена')
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
        <h1 class="text-2xl font-bold">Страницы</h1>
      </div>
      <Button @click="showCreate = true">
        <Plus class="size-4 mr-1" />
        Новая страница
      </Button>
    </div>

    <div v-if="store.loading" class="text-muted-foreground">Загрузка...</div>

    <div v-else-if="store.pages.length === 0" class="border border-dashed rounded-lg p-10 text-center">
      <FileText class="size-10 mx-auto text-muted-foreground mb-3" />
      <p class="text-muted-foreground mb-3">Нет страниц</p>
      <Button @click="showCreate = true">
        <Plus class="size-4 mr-1" />
        Создать страницу
      </Button>
    </div>

    <div v-else class="space-y-2">
      <Card v-for="p in store.pages" :key="p.id" class="hover:bg-accent/30 transition-colors">
        <CardContent class="py-3 px-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <FileText class="size-4 text-muted-foreground" />
            <div>
              <div class="flex items-center gap-2">
                <p class="font-medium">{{ p.name }}</p>
                <Badge v-if="p.isPublished" variant="secondary" class="text-xs">
                  <Globe class="size-3 mr-0.5" />
                  Опубликована
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground">/{{ p.slug }}</p>
            </div>
          </div>
          <div class="flex gap-1">
            <Button variant="ghost" size="icon-sm" @click="router.push(`/pages/${p.id}/edit`)">
              <Pencil class="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" class="text-muted-foreground hover:text-destructive" @click="deletePage(p.id, p.name)">
              <Trash2 class="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create dialog -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showCreate = false">
      <div class="bg-background rounded-xl shadow-lg p-6 w-80 space-y-4">
        <h2 class="text-lg font-semibold">Новая страница</h2>
        <div>
          <Label class="text-sm">Название *</Label>
          <Input v-model="newName" class="mt-1" placeholder="О нас" @input="onNameInput" @keyup.enter="createPage" />
        </div>
        <div>
          <Label class="text-sm">Slug (URL) *</Label>
          <Input v-model="newSlug" class="mt-1" placeholder="about" />
        </div>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" @click="showCreate = false">Отмена</Button>
          <Button :disabled="!newName.trim() || !newSlug.trim() || creating" @click="createPage">
            {{ creating ? 'Создание...' : 'Создать' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
