<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects.store'
import { Card, CardContent } from '@/components/ui/card'
import { LayoutGrid, FileText, Puzzle, Zap, ArrowRight, Database } from 'lucide-vue-next'
import DatabasePanel from '@/components/projects/DatabasePanel.vue'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()

const projectId = route.params.id as string
const dbOpen = ref(false)

onMounted(async () => {
  await store.loadProjects()
  store.activeProjectId = projectId
  await Promise.all([
    store.loadLayouts(projectId),
    store.loadPages(projectId),
  ])
})
</script>

<template>
  <div class="p-6 max-w-3xl">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">{{ store.activeProject?.name ?? 'Проект' }}</h1>
      <p v-if="store.activeProject?.description" class="text-muted-foreground mt-1">
        {{ store.activeProject.description }}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- Layouts -->
      <Card class="cursor-pointer hover:bg-accent/30 transition-colors" @click="router.push(`/projects/${projectId}/layouts`)">
        <CardContent class="pt-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutGrid class="size-5 text-primary" />
            </div>
            <div>
              <p class="font-semibold">Макеты</p>
              <p class="text-sm text-muted-foreground">{{ store.layouts.length }} шт.</p>
            </div>
          </div>
          <ArrowRight class="size-4 text-muted-foreground" />
        </CardContent>
      </Card>

      <!-- Pages -->
      <Card class="cursor-pointer hover:bg-accent/30 transition-colors" @click="router.push(`/projects/${projectId}/pages`)">
        <CardContent class="pt-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <FileText class="size-5 text-green-500" />
            </div>
            <div>
              <p class="font-semibold">Страницы</p>
              <p class="text-sm text-muted-foreground">{{ store.pages.length }} шт.</p>
            </div>
          </div>
          <ArrowRight class="size-4 text-muted-foreground" />
        </CardContent>
      </Card>

      <!-- Widgets -->
      <Card class="cursor-pointer hover:bg-accent/30 transition-colors" @click="router.push(`/projects/${projectId}/widgets`)">
        <CardContent class="pt-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Puzzle class="size-5 text-purple-500" />
            </div>
            <div>
              <p class="font-semibold">Виджеты</p>
              <p class="text-sm text-muted-foreground">UI компоненты</p>
            </div>
          </div>
          <ArrowRight class="size-4 text-muted-foreground" />
        </CardContent>
      </Card>

      <!-- Workflows -->
      <Card class="cursor-pointer hover:bg-accent/30 transition-colors" @click="router.push(`/projects/${projectId}/workflows`)">
        <CardContent class="pt-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Zap class="size-5 text-blue-500" />
            </div>
            <div>
              <p class="font-semibold">Воркфлоу</p>
              <p class="text-sm text-muted-foreground">Действия и триггеры</p>
            </div>
          </div>
          <ArrowRight class="size-4 text-muted-foreground" />
        </CardContent>
      </Card>

      <!-- Database — spans full width -->
      <Card class="cursor-pointer hover:bg-accent/30 transition-colors col-span-2" @click="dbOpen = true">
        <CardContent class="pt-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Database class="size-5 text-orange-500" />
            </div>
            <div>
              <p class="font-semibold">База данных</p>
              <p class="text-sm text-muted-foreground">
                <template v-if="store.activeProject?.supabaseUrl">
                  Supabase подключена · {{ store.activeProject.supabaseUrl.replace('https://', '') }}
                </template>
                <template v-else>
                  Не подключена — нажмите для настройки
                </template>
              </p>
            </div>
          </div>
          <ArrowRight class="size-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>

    <!-- Database connection panel -->
    <DatabasePanel
      v-model:open="dbOpen"
      :project="store.activeProject"
    />
  </div>
</template>
