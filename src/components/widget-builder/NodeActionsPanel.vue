<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { nanoid } from 'nanoid'
import type { ActionStep, ActionType, TriggerType } from '@/types'
import type { WidgetType } from '@/types/widget-builder'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import ActionStepCard from '@/components/actions/ActionStep.vue'
import ActionPalette from '@/components/actions/ActionPalette.vue'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Plus, Zap } from 'lucide-vue-next'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode!)

// ── Provide context for ElementPicker / ActionStep ────────────────────────
provide('widgetNodes', computed(() =>
  [...store.index.values()].map(n => ({ id: n.id, name: n.name, type: n.type as string }))
))
provide('projectId',       computed(() => store.widget?.projectId ?? ''))
provide('currentWidgetId', computed(() => store.widget?.id ?? ''))

// ── Triggers per widget type ───────────────────────────────────────────────
type TriggerMeta = { value: TriggerType; label: string }

const TRIGGERS_MAP: Partial<Record<WidgetType, TriggerMeta[]>> = {
  Button: [
    { value: 'onClick',  label: 'onClick — нажатие' },
    { value: 'onHover',  label: 'onHover — наведение' },
    { value: 'onInit',   label: 'onInit — монтирование' },
  ],
  TextField: [
    { value: 'onChange', label: 'onChange — изменение' },
    { value: 'onSubmit', label: 'onSubmit — отправка' },
    { value: 'onInit',   label: 'onInit — монтирование' },
  ],
  Icon: [
    { value: 'onClick',  label: 'onClick — нажатие' },
    { value: 'onInit',   label: 'onInit — монтирование' },
  ],
}

const DEFAULT_TRIGGERS: TriggerMeta[] = [
  { value: 'onClick', label: 'onClick — нажатие' },
  { value: 'onInit',  label: 'onInit — монтирование' },
]

const triggers = computed<TriggerMeta[]>(() => {
  const type = node.value?.type
  return (type ? TRIGGERS_MAP[type] : undefined) ?? DEFAULT_TRIGGERS
})

// ── Expanded sections ─────────────────────────────────────────────────────
const expanded = ref<Set<TriggerType>>(new Set(['onClick']))

function toggleSection(t: TriggerType) {
  if (expanded.value.has(t)) expanded.value.delete(t)
  else expanded.value.add(t)
  // trigger reactivity
  expanded.value = new Set(expanded.value)
}

// ── Steps access / mutation ────────────────────────────────────────────────
function getSteps(trigger: TriggerType): ActionStep[] {
  return node.value?.actions?.[trigger] ?? []
}

function setSteps(trigger: TriggerType, steps: ActionStep[]) {
  if (!node.value) return
  store.updateNodeActions(node.value.id, {
    ...(node.value.actions ?? {}),
    [trigger]: steps,
  })
}

// ── Palette ───────────────────────────────────────────────────────────────
const paletteOpen   = ref(false)
const activeTrigger = ref<TriggerType>('onClick')

function openPalette(trigger: TriggerType) {
  activeTrigger.value = trigger
  paletteOpen.value = true
}

function addStep(type: ActionType) {
  const step: ActionStep = {
    id: nanoid(),
    type,
    config: {},
    conditions: [],
    onSuccess: [],
    onError: [],
  }
  setSteps(activeTrigger.value, [...getSteps(activeTrigger.value), step])
  paletteOpen.value = false
}

function updateStep(trigger: TriggerType, idx: number, updated: ActionStep) {
  const steps = [...getSteps(trigger)]
  steps[idx] = updated
  setSteps(trigger, steps)
}

function removeStep(trigger: TriggerType, idx: number) {
  setSteps(trigger, getSteps(trigger).filter((_, i) => i !== idx))
}
</script>

<template>
  <div class="p-3 space-y-2">
    <!-- Empty state when no node -->
    <div v-if="!node" class="text-xs text-muted-foreground text-center py-6">
      Выберите элемент
    </div>

    <template v-else>
      <!-- Trigger sections -->
      <div
        v-for="trigger in triggers"
        :key="trigger.value"
        class="border rounded-lg overflow-hidden"
      >
        <!-- Section header -->
        <button
          class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
          @click="toggleSection(trigger.value)"
        >
          <component
            :is="expanded.has(trigger.value) ? ChevronDown : ChevronRight"
            class="size-3.5 text-muted-foreground shrink-0"
          />
          <Zap class="size-3.5 text-primary/70 shrink-0" />
          <span class="text-xs font-medium flex-1">{{ trigger.label }}</span>
          <span
            v-if="getSteps(trigger.value).length"
            class="text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-medium"
          >{{ getSteps(trigger.value).length }}</span>
        </button>

        <!-- Steps + Add button -->
        <div v-if="expanded.has(trigger.value)" class="border-t">
          <!-- Empty -->
          <div v-if="!getSteps(trigger.value).length" class="px-3 py-3 text-xs text-muted-foreground text-center">
            Нет шагов
          </div>

          <!-- Step list -->
          <div v-else class="p-2 space-y-1.5">
            <ActionStepCard
              v-for="(step, idx) in getSteps(trigger.value)"
              :key="step.id"
              :step="step"
              :index="idx"
              @update="updateStep(trigger.value, idx, $event)"
              @remove="removeStep(trigger.value, idx)"
            />
          </div>

          <!-- Add step -->
          <div class="px-2 pb-2">
            <Button
              variant="outline"
              size="sm"
              class="w-full h-7 text-xs"
              @click="openPalette(trigger.value)"
            >
              <Plus class="size-3 mr-1" />
              Добавить шаг
            </Button>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Action palette sheet -->
  <ActionPalette
    :open="paletteOpen"
    @update:open="paletteOpen = $event"
    @select="addStep"
  />
</template>
