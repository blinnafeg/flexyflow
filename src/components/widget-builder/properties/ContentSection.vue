<script setup lang="ts">
import { computed } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import RichTextSection from './RichTextSection.vue'
import IconSection from './IconSection.vue'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode!)
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Содержимое</p>

    <!-- Icon -->
    <IconSection v-if="node.type === 'Icon'" />

    <!-- Text content -->
    <div v-if="node.type === 'Text'" class="space-y-1">
      <Label class="text-xs">Текст</Label>
      <Textarea
        :model-value="node.props.text ?? ''"
        class="text-sm min-h-[80px] resize-y"
        placeholder="Введите текст..."
        @update:model-value="store.updateProps(node.id, { text: $event })"
      />
    </div>

    <!-- Button label -->
    <div v-if="node.type === 'Button'" class="space-y-1">
      <Label class="text-xs">Надпись кнопки</Label>
      <Input
        :model-value="node.props.text ?? 'Button'"
        class="h-8 text-sm"
        @update:model-value="store.updateProps(node.id, { text: $event })"
      />
    </div>

    <!-- TextField placeholder -->
    <div v-if="node.type === 'TextField'" class="space-y-1">
      <Label class="text-xs">Placeholder</Label>
      <Input
        :model-value="node.props.placeholder ?? ''"
        class="h-8 text-sm"
        @update:model-value="store.updateProps(node.id, { placeholder: $event })"
      />
    </div>

    <!-- RichText spans -->
    <RichTextSection v-if="node.type === 'RichText'" />
  </div>
</template>
