<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects.store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, FileText, LayoutGrid, ArrowRight, Plus } from 'lucide-vue-next'

const store = useProjectsStore()
const router = useRouter()

onMounted(() => store.loadProjects())
</script>

<template>
  <div class="p-6 max-w-4xl">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Дашборд</h1>
      <p class="text-muted-foreground mt-1">Добро пожаловать в FlexyFlow — визуальный конструктор страниц</p>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <Card>
        <CardContent class="pt-5 flex items-center gap-3">
          <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderOpen class="size-5 text-primary" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ store.projects.length }}</p>
            <p class="text-sm text-muted-foreground">Проектов</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-5 flex items-center gap-3">
          <div class="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <LayoutGrid class="size-5 text-blue-500" />
          </div>
          <div>
            <p class="text-2xl font-bold">—</p>
            <p class="text-sm text-muted-foreground">Макетов</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-5 flex items-center gap-3">
          <div class="size-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <FileText class="size-5 text-green-500" />
          </div>
          <div>
            <p class="text-2xl font-bold">—</p>
            <p class="text-sm text-muted-foreground">Страниц</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent projects -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Последние проекты</h2>
        <Button variant="outline" size="sm" @click="router.push('/projects')">
          Все проекты <ArrowRight class="size-4 ml-1" />
        </Button>
      </div>

      <div v-if="store.loading" class="text-muted-foreground text-sm">Загрузка...</div>
      <div v-else-if="store.projects.length === 0" class="border border-dashed rounded-lg p-8 text-center">
        <p class="text-muted-foreground mb-3">Нет проектов. Создайте первый!</p>
        <Button @click="router.push('/projects')">
          <Plus class="size-4 mr-1" />
          Создать проект
        </Button>
      </div>
      <div v-else class="space-y-2">
        <Card
          v-for="p in store.projects.slice(0, 5)"
          :key="p.id"
          class="cursor-pointer hover:bg-accent/40 transition-colors"
          @click="router.push(`/projects/${p.id}`)"
        >
          <CardContent class="py-3 px-4 flex items-center justify-between">
            <div>
              <p class="font-medium">{{ p.name }}</p>
              <p v-if="p.description" class="text-xs text-muted-foreground">{{ p.description }}</p>
            </div>
            <ArrowRight class="size-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
