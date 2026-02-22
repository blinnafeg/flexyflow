<script setup lang="ts">
import { computed } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import type { RichTextSpan } from '@/types/widget-builder'
import { newRichSpan } from '@/composables/useWidgetTree'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, Italic, Underline } from 'lucide-vue-next'
import FontPicker from './FontPicker.vue'
import ColorPickerInput from '@/components/color-picker/ColorPickerInput.vue'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode!)

const spans = computed(() => node.value.props.richSpans ?? [])

function setSpans(next: RichTextSpan[]) {
  store.updateProps(node.value.id, { richSpans: next })
}

function updateSpan(id: string, patch: Partial<RichTextSpan>) {
  setSpans(spans.value.map(s => s.id === id ? { ...s, ...patch } : s))
}

function removeSpan(id: string) {
  if (spans.value.length <= 1) return
  setSpans(spans.value.filter(s => s.id !== id))
}

function addSpan() {
  setSpans([...spans.value, newRichSpan()])
}
</script>

<template>
  <div class="space-y-3">
    <div class="space-y-2">
      <div
        v-for="(span, idx) in spans"
        :key="span.id"
        class="border rounded-md p-2 space-y-2 bg-muted/20"
      >
        <!-- Header row -->
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">Спан {{ idx + 1 }}</span>
          <button
            class="size-5 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
            :disabled="spans.length <= 1"
            @click="removeSpan(span.id)"
          >
            <Trash2 class="size-3" />
          </button>
        </div>

        <!-- Text content -->
        <div>
          <Label class="text-xs">Текст</Label>
          <Input
            :model-value="span.text"
            class="h-7 text-xs mt-0.5"
            placeholder="Текст..."
            @update:model-value="updateSpan(span.id, { text: $event })"
          />
        </div>

        <!-- Color -->
        <div>
          <Label class="text-xs">Цвет</Label>
          <div class="mt-0.5">
            <ColorPickerInput
              :model-value="span.color || ''"
              placeholder="#111827"
              :allow-clear="true"
              @update:model-value="updateSpan(span.id, { color: $event || undefined })"
            />
          </div>
        </div>

        <!-- Font size -->
        <div>
          <Label class="text-xs">Размер (px)</Label>
          <Input
            :model-value="span.fontSize ?? ''"
            type="number" min="1" class="h-7 text-xs mt-0.5"
            placeholder="авто"
            @update:model-value="updateSpan(span.id, { fontSize: $event ? Number($event) : undefined })"
          />
        </div>

        <!-- Weight -->
        <div>
          <Label class="text-xs">Насыщенность</Label>
          <Select
            :model-value="span.fontWeight ?? '__none__'"
            @update:model-value="updateSpan(span.id, { fontWeight: $event === '__none__' ? undefined : $event as any })"
          >
            <SelectTrigger class="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— авто —</SelectItem>
              <SelectItem value="300">Light 300</SelectItem>
              <SelectItem value="400">Regular 400</SelectItem>
              <SelectItem value="500">Medium 500</SelectItem>
              <SelectItem value="600">SemiBold 600</SelectItem>
              <SelectItem value="700">Bold 700</SelectItem>
              <SelectItem value="800">ExtraBold 800</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Font family -->
        <div>
          <Label class="text-xs">Шрифт</Label>
          <div class="mt-0.5">
            <FontPicker
              :model-value="span.fontFamily"
              @update:model-value="updateSpan(span.id, { fontFamily: $event })"
            />
          </div>
        </div>

        <!-- Italic + Underline -->
        <div class="flex gap-1">
          <button
            class="flex-1 h-7 flex items-center justify-center rounded border text-xs transition-colors gap-1"
            :class="span.italic ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'"
            @click="updateSpan(span.id, { italic: !span.italic })"
          >
            <Italic class="size-3" /> Italic
          </button>
          <button
            class="flex-1 h-7 flex items-center justify-center rounded border text-xs transition-colors gap-1"
            :class="span.underline ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'"
            @click="updateSpan(span.id, { underline: !span.underline })"
          >
            <Underline class="size-3" /> Underline
          </button>
        </div>
      </div>
    </div>

    <button
      class="w-full h-7 text-xs border border-dashed rounded flex items-center justify-center gap-1 hover:bg-accent transition-colors text-muted-foreground"
      @click="addSpan"
    >
      <Plus class="size-3" /> Добавить спан
    </button>
  </div>
</template>
