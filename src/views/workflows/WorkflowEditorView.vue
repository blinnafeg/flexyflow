<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Workflow } from '@/types'
import { useWorkflowsStore } from '@/stores/workflows.store'
import { useBuilderStore } from '@/stores/builder.store'
import ActionBuilder from '@/components/actions/ActionBuilder.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Loader2, Play } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { fetchWorkflow, executeWorkflow } from '@/services/WorkflowService'

const route = useRoute()
const router = useRouter()
const workflowsStore = useWorkflowsStore()
const builderStore = useBuilderStore()

const workflowId = route.params.id as string
const saving = ref(false)
const running = ref(false)

const workflow = ref<Workflow | null>(null)

onMounted(async () => {
  try {
    const w = await fetchWorkflow(workflowId)
    workflow.value = w
    builderStore.setActiveWorkflow(w)
  } catch (e: unknown) {
    toast.error((e as Error).message)
  }
})

async function save() {
  if (!workflow.value) return
  saving.value = true
  try {
    const updated = await workflowsStore.update(workflowId, {
      name: workflow.value.name,
      trigger: workflow.value.trigger,
      steps: workflow.value.steps,
    })
    workflow.value = updated
    toast.success('Воркфлоу сохранён')
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    saving.value = false
  }
}

async function run() {
  if (!workflow.value) return
  running.value = true
  try {
    await executeWorkflow(workflow.value, {
      pageId: workflow.value.pageId ?? '',
      widgetId: workflow.value.widgetId,
      state: {},
    })
    toast.success('Воркфлоу выполнен')
  } catch (e: unknown) {
    toast.error((e as Error).message)
  } finally {
    running.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Toolbar -->
    <div class="flex items-center gap-3 px-4 py-2.5 border-b bg-card shrink-0">
      <Button variant="ghost" size="icon-sm" @click="router.back()">
        <ArrowLeft class="size-4" />
      </Button>
      <Input
        v-if="workflow"
        v-model="workflow.name"
        class="h-8 w-52 text-sm font-medium"
      />
      <span class="text-xs text-muted-foreground flex-1">Редактор воркфлоу</span>
      <Button variant="outline" size="sm" :disabled="running" @click="run">
        <Loader2 v-if="running" class="size-4 mr-1 animate-spin" />
        <Play v-else class="size-4 mr-1" />
        Запустить
      </Button>
      <Button :disabled="saving" @click="save">
        <Loader2 v-if="saving" class="size-4 mr-1 animate-spin" />
        <Save v-else class="size-4 mr-1" />
        Сохранить
      </Button>
    </div>

    <!-- Builder -->
    <div class="flex-1 overflow-auto p-6 max-w-xl">
      <div v-if="!workflow" class="text-muted-foreground">Загрузка...</div>
      <ActionBuilder
        v-else
        :workflow="workflow"
        @update="workflow = $event"
        @run="run"
      />
    </div>
  </div>
</template>
