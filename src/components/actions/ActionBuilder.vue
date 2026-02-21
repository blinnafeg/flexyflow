<script setup lang="ts">
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { Workflow, ActionStep, TriggerType, ActionType } from '@/types'
import ActionStepCard from './ActionStep.vue'
import ActionPalette from './ActionPalette.vue'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Plus, Play } from 'lucide-vue-next'

const props = defineProps<{
  workflow: Workflow
}>()

const emit = defineEmits<{
  (e: 'update', workflow: Workflow): void
  (e: 'run'): void
}>()

const paletteOpen = ref(false)

const triggerOptions: { value: TriggerType; label: string }[] = [
  { value: 'onClick', label: 'onClick — клик' },
  { value: 'onSubmit', label: 'onSubmit — отправка формы' },
  { value: 'onInit', label: 'onInit — инициализация' },
  { value: 'onChange', label: 'onChange — изменение значения' },
  { value: 'onHover', label: 'onHover — наведение' },
  { value: 'onPageLoad', label: 'onPageLoad — загрузка страницы' },
  { value: 'onWidgetMount', label: 'onWidgetMount — монтирование виджета' },
]

function setTrigger(trigger: string) {
  emit('update', { ...props.workflow, trigger: trigger as TriggerType })
}

function addStep(type: ActionType) {
  const newStep: ActionStep = {
    id: nanoid(),
    type,
    config: {},
    conditions: [],
    onSuccess: [],
    onError: [],
  }
  emit('update', {
    ...props.workflow,
    steps: [...props.workflow.steps, newStep],
  })
}

function updateStep(index: number, updated: ActionStep) {
  const steps = [...props.workflow.steps]
  steps[index] = updated
  emit('update', { ...props.workflow, steps })
}

function removeStep(index: number) {
  const steps = props.workflow.steps.filter((_, i) => i !== index)
  emit('update', { ...props.workflow, steps })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Trigger selector -->
    <div class="space-y-1.5">
      <Label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Триггер</Label>
      <Select :model-value="workflow.trigger" @update:model-value="setTrigger">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="Выберите триггер" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in triggerOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Separator />

    <!-- Steps list -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <Label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Шаги
          <Badge v-if="workflow.steps.length" variant="secondary" class="ml-1.5 text-xs">
            {{ workflow.steps.length }}
          </Badge>
        </Label>
      </div>

      <div v-if="workflow.steps.length === 0" class="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
        Нет шагов. Нажмите «+ Добавить шаг».
      </div>

      <div v-else class="space-y-1.5">
        <ActionStepCard
          v-for="(step, idx) in workflow.steps"
          :key="step.id"
          :step="step"
          :index="idx"
          @update="updateStep(idx, $event)"
          @remove="removeStep(idx)"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <Button variant="outline" class="flex-1" @click="paletteOpen = true">
        <Plus class="size-4 mr-1" />
        Добавить шаг
      </Button>
      <Button variant="default" size="icon" title="Запустить" @click="emit('run')">
        <Play class="size-4" />
      </Button>
    </div>
  </div>

  <!-- Action palette sheet -->
  <ActionPalette
    :open="paletteOpen"
    @update:open="paletteOpen = $event"
    @select="addStep"
  />
</template>
