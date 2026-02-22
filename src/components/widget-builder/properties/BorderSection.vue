<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWidgetBuilderStore } from '@/stores/widget-builder.store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Link } from 'lucide-vue-next'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import ColorPickerInput from '@/components/color-picker/ColorPickerInput.vue'

const store = useWidgetBuilderStore()
const node = computed(() => store.selectedNode!)

function updateBorder(patch: object) {
  store.updatePropsSelected( { border: { ...node.value.props.border, ...patch } as any })
}

function updateRadius(side: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft', val: number) {
  const r = node.value.props.borderRadius
  if (r.linked) {
    store.updatePropsSelected( {
      borderRadius: { ...r, topLeft: val, topRight: val, bottomRight: val, bottomLeft: val },
    })
  } else {
    store.updatePropsSelected( { borderRadius: { ...r, [side]: val } })
  }
}

function toggleLinked() {
  store.updatePropsSelected( {
    borderRadius: { ...node.value.props.borderRadius, linked: !node.value.props.borderRadius.linked },
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Border -->
    <div class="space-y-2">
      <p class="text-xs text-muted-foreground font-medium">Граница</p>
      <div class="grid grid-cols-2 gap-1.5">
        <div>
          <Label class="text-[10px] text-muted-foreground">Толщина (px)</Label>
          <Input
            :model-value="node.props.border.width" type="number" min="0" class="h-7 text-xs"
            @update:model-value="updateBorder({ width: Number($event) })"
          />
        </div>
        <div>
          <Label class="text-[10px] text-muted-foreground">Стиль</Label>
          <Select :model-value="node.props.border.style" @update:model-value="updateBorder({ style: $event })">
            <SelectTrigger class="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">none</SelectItem>
              <SelectItem value="solid">solid</SelectItem>
              <SelectItem value="dashed">dashed</SelectItem>
              <SelectItem value="dotted">dotted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="col-span-2">
          <Label class="text-[10px] text-muted-foreground">Цвет</Label>
          <div class="mt-0.5">
            <ColorPickerInput
              :model-value="node.props.border.color"
              placeholder="#000000"
              @update:model-value="updateBorder({ color: $event })"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Border radius -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="text-xs text-muted-foreground font-medium">Скругление углов</p>
        <button
          :class="node.props.borderRadius.linked ? 'text-primary' : 'text-muted-foreground'"
          title="Связать углы"
          @click="toggleLinked"
        ><Link class="size-3" /></button>
      </div>

      <div v-if="node.props.borderRadius.linked">
        <Input
          :model-value="node.props.borderRadius.topLeft" type="number" min="0" class="h-7 text-xs"
          placeholder="0"
          @update:model-value="updateRadius('topLeft', Number($event))"
        />
      </div>

      <div v-else class="grid grid-cols-2 gap-1.5">
        <div v-for="[key, label] in [['topLeft','↖ TL'],['topRight','↗ TR'],['bottomLeft','↙ BL'],['bottomRight','↘ BR']]" :key="key">
          <Label class="text-[10px] text-muted-foreground">{{ label }}</Label>
          <Input
            :model-value="(node.props.borderRadius as any)[key]" type="number" min="0" class="h-7 text-xs"
            @update:model-value="updateRadius(key as any, Number($event))"
          />
        </div>
      </div>
    </div>
  </div>
</template>
