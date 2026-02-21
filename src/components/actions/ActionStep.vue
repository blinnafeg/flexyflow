<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { ActionStep } from '@/types'
import { getActionDef } from '@/registry/actions.registry'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import ElementPicker from '@/components/widget-builder/ElementPicker.vue'
import {
  Eye, EyeOff, ToggleLeft, Navigation, ArrowLeft,
  Download, Plus, Pencil, Trash2, Variable, Eraser,
  Bell, Square, ChevronsDown, Code2, ChevronDown, ChevronRight, X,
} from 'lucide-vue-next'

// ── Injected context (provided by NodeActionsPanel) ───────────────────────
type NodeItem = { id: string; name: string; type: string }
const widgetNodes    = inject<ComputedRef<NodeItem[]>>('widgetNodes',    { value: [] } as unknown as ComputedRef<NodeItem[]>)
const projectIdRef   = inject<ComputedRef<string> | Ref<string>>('projectId',       ref(''))
const currentWidgetIdRef = inject<ComputedRef<string> | Ref<string>>('currentWidgetId', ref(''))

// Auto-unwrap for template use
const projectId       = computed(() => projectIdRef.value)
const currentWidgetId = computed(() => currentWidgetIdRef.value)
const hasElementPicker = computed(() => !!projectId.value)

const props = defineProps<{
  step: ActionStep
  index: number
}>()

const emit = defineEmits<{
  (e: 'update', step: ActionStep): void
  (e: 'remove'): void
}>()

const expanded = ref(false)

const iconMap: Record<string, unknown> = {
  Eye, EyeOff, ToggleLeft, Navigation, ArrowLeft,
  Download, Plus, Pencil, Trash2, Variable, Eraser,
  Bell, Square, ChevronsDown, Code2,
}

const definition = computed(() => getActionDef(props.step.type))
const stepIcon   = computed(() => definition.value ? iconMap[definition.value.icon] : Code2)

function updateConfig(key: string, value: unknown) {
  emit('update', {
    ...props.step,
    config: { ...props.step.config, [key]: value },
  })
}

function getConfigValue(key: string): string {
  const v = props.step.config[key]
  return v != null ? String(v) : ''
}

// Human-readable summary for collapsed header
const configSummary = computed(() => {
  if (!definition.value) return 'Нет настроек'
  const entries = Object.entries(props.step.config).filter(([, v]) => v)
  if (!entries.length) return 'Нет настроек'
  return entries.map(([k, v]) => {
    const val = String(v)
    if (k === 'elementId' || k === 'modalId') {
      if (val.startsWith('w:')) return `виджет: …${val.slice(-6)}`
      const node = widgetNodes.value.find(n => n.id === val)
      return node ? node.name : `${k}: ${val.slice(0, 8)}`
    }
    return `${k}: ${val}`
  }).join(' · ')
})
</script>

<template>
  <Card class="border border-border shadow-none">
    <CardContent class="p-0">
      <!-- Header row -->
      <div
        class="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none hover:bg-muted/40 transition-colors rounded-lg"
        @click="expanded = !expanded"
      >
        <span class="text-xs text-muted-foreground font-mono w-4 shrink-0">{{ index + 1 }}</span>
        <component :is="stepIcon" class="size-4 text-primary shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ definition?.label ?? step.type }}</p>
          <p class="text-xs text-muted-foreground truncate">{{ configSummary }}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          class="shrink-0 text-muted-foreground hover:text-destructive"
          @click.stop="emit('remove')"
        >
          <X class="size-3.5" />
        </Button>
        <component :is="expanded ? ChevronDown : ChevronRight" class="size-3.5 text-muted-foreground shrink-0" />
      </div>

      <!-- Config fields -->
      <div v-if="expanded && definition" class="px-3 pb-3 space-y-3 border-t border-border pt-3">
        <div v-for="field in definition.configFields" :key="field.key">
          <Label class="text-xs mb-1">
            {{ field.label }}<span v-if="field.required" class="text-destructive ml-0.5">*</span>
          </Label>
          <p v-if="field.description" class="text-xs text-muted-foreground mb-1">{{ field.description }}</p>

          <!-- Code field -->
          <Textarea
            v-if="field.type === 'code'"
            :model-value="getConfigValue(field.key)"
            :placeholder="field.placeholder"
            class="font-mono text-xs h-28 resize-y"
            @update:model-value="updateConfig(field.key, $event)"
          />

          <!-- Select field (explicit options) -->
          <Select
            v-else-if="field.type === 'select' && field.options"
            :model-value="getConfigValue(field.key)"
            @update:model-value="updateConfig(field.key, $event)"
          >
            <SelectTrigger class="h-8 text-sm">
              <SelectValue :placeholder="`Выберите ${field.label.toLowerCase()}`" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in field.options" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- elementId / modalId: cross-widget element picker -->
          <ElementPicker
            v-else-if="(field.type === 'elementId' || field.key === 'modalId') && hasElementPicker"
            :model-value="getConfigValue(field.key)"
            :project-id="projectId"
            :current-widget-id="currentWidgetId"
            @update:model-value="updateConfig(field.key, $event)"
          />

          <!-- Fallback: plain text input -->
          <Input
            v-else
            :model-value="getConfigValue(field.key)"
            :placeholder="field.placeholder"
            class="h-8 text-sm"
            @update:model-value="updateConfig(field.key, $event)"
          />
        </div>
      </div>

      <!-- No fields -->
      <div v-else-if="expanded && definition && definition.configFields.length === 0" class="px-3 pb-3 pt-3 border-t border-border">
        <p class="text-xs text-muted-foreground">Это действие не требует настройки.</p>
      </div>
    </CardContent>
  </Card>
</template>
