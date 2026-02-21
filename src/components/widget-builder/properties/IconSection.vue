<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import IconPicker from '../IconPicker.vue'
import { resolveIcon } from '@/registry/icon-packages'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode!)
const pickerOpen = ref(false)

const currentIcon = computed(() =>
  resolveIcon(node.value.props.iconPackage, node.value.props.iconName)
)

function onSelect(packageId: string, iconName: string) {
  store.updateProps(node.value.id, { iconPackage: packageId, iconName })
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Иконка</p>

    <!-- Превью + выбор -->
    <div class="space-y-2">
      <Label class="text-xs">Выбранная иконка</Label>
      <div class="flex items-center gap-2">
        <!-- Превью текущей иконки -->
        <div class="flex items-center justify-center w-10 h-10 rounded-md border bg-muted/30 shrink-0">
          <component
            v-if="currentIcon"
            :is="currentIcon"
            :size="20"
            :color="node.props.iconColor || 'currentColor'"
            :stroke-width="node.props.iconStrokeWidth ?? 2"
          />
          <span v-else class="text-xs text-muted-foreground select-none">?</span>
        </div>
        <div class="flex-1 min-w-0">
          <Button
            variant="outline"
            size="sm"
            class="w-full text-xs h-8"
            @click="pickerOpen = true"
          >
            Выбрать иконку...
          </Button>
          <p v-if="node.props.iconName" class="text-[10px] text-muted-foreground font-mono mt-1 truncate">
            {{ node.props.iconPackage }} / {{ node.props.iconName }}
          </p>
        </div>
      </div>
    </div>

    <!-- Размер -->
    <div class="space-y-1.5">
      <Label class="text-xs">Размер (px)</Label>
      <Input
        type="number"
        :model-value="node.props.iconSize ?? 24"
        class="h-8 text-sm"
        min="8"
        max="256"
        @update:model-value="store.updateProps(node.id, { iconSize: Number($event) })"
      />
    </div>

    <!-- Толщина линий (Lucide) -->
    <div class="space-y-1.5">
      <Label class="text-xs">Толщина линий</Label>
      <Input
        type="number"
        :model-value="node.props.iconStrokeWidth ?? 2"
        class="h-8 text-sm"
        min="0.5"
        max="4"
        step="0.25"
        @update:model-value="store.updateProps(node.id, { iconStrokeWidth: Number($event) })"
      />
    </div>

    <!-- Цвет иконки -->
    <div class="space-y-1.5">
      <Label class="text-xs">Цвет иконки</Label>
      <div class="flex items-center gap-2">
        <input
          type="color"
          :value="node.props.iconColor || '#111827'"
          class="w-8 h-8 rounded cursor-pointer border border-input p-0.5 bg-transparent shrink-0"
          @input="store.updateProps(node.id, { iconColor: ($event.target as HTMLInputElement).value })"
        />
        <Input
          :model-value="node.props.iconColor || ''"
          placeholder="currentColor"
          class="h-8 text-sm font-mono flex-1"
          @update:model-value="store.updateProps(node.id, { iconColor: $event })"
        />
        <button
          v-if="node.props.iconColor"
          class="text-[11px] text-muted-foreground hover:text-foreground px-1 shrink-0"
          title="Сбросить (использовать currentColor)"
          @click="store.updateProps(node.id, { iconColor: '' })"
        >
          ✕
        </button>
      </div>
      <p class="text-[10px] text-muted-foreground">
        Пусто = наследовать цвет из раздела «Цвета»
      </p>
    </div>
  </div>

  <IconPicker
    v-model="pickerOpen"
    :selected-package="node.props.iconPackage"
    :selected-icon="node.props.iconName"
    @select="onSelect"
  />
</template>
