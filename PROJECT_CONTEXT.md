# PROJECT_CONTEXT.md - Контекст проекта FlexyFlow для ИИ

Этот файл содержит ключевую информацию о проекте FlexyFlow, оптимизированную для быстрого понимания ИИ. Он включает основные архитектурные принципы, ключевые компоненты и примеры кода.

## 1. Общая архитектура проекта

FlexyFlow - это визуальный конструктор страниц с системой действий и воркфлоу, аналог FlutterFlow. Проект построен на следующем стеке:

- Vue 3 (Composition API, `<script setup>`)
- TypeScript (strict mode)
- Vite (сборщик)
- Tailwind CSS v4 (CSS-native, без config-файла)
- shadcn-vue (UI компоненты поверх reka-ui / radix-vue)
- Pinia (управление состоянием)
- Vue Router 4
- Supabase (self-hosted, БД и API)

## 2. Основные концепции

### 2.1. Структура проекта
Проект состоит из следующих основных сущностей:
- **Проекты** (Projects) - контейнеры для макетов, страниц, виджетов и воркфлоу
- **Макеты** (Layouts) - сеточные структуры страниц с именованными слотами
- **Страницы** (Pages) - конкретные страницы, использующие макеты и содержащие виджеты
- **Виджеты** (Widgets) - переиспользуемые UI компоненты, созданные в визуальном редакторе
- **Воркфлоу** (Workflows) - последовательности действий, реагирующие на триггеры

### 2.2. Виджеты
Виджеты - это основные строительные блоки страниц. Они создаются в визуальном редакторе и могут содержать:
- Базовые элементы: Column, Row, Container, Text, Button, TextField, RichText
- Специализированные элементы: ListView (списки с привязкой к данным)

Каждый элемент имеет свойства:
- Размеры (ширина, высота)
- Отступы (padding, margin)
- Цвета (фон, текст)
- Границы (border, border-radius)
- Типографика (шрифт, размер, вес)
- Flex-свойства (для контейнеров)

### 2.3. Воркфлоу
Воркфлоу - это последовательности действий, реагирующие на триггеры:
- Триггеры: onClick, onSubmit, onInit, onChange, onHover, onPageLoad, onWidgetMount
- Действия: visibility, navigation, data, state, ui, custom
- Условия: фильтрация выполнения шагов по условиям
- Ветвление: onSuccess/onError обработчики для шагов

## 3. Ключевые файлы и компоненты

### 3.1. Основная структура приложения

`src/main.ts` - точка входа приложения:
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/index.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

`src/App.vue` - корневой компонент:
```vue
<template>
  <!-- Standalone view (no shell) -->
  <template v-if="isStandalone">
    <RouterView />
    <Toaster rich-colors position="top-right" />
  </template>

  <!-- Admin shell -->
  <template v-else>
    <div class="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>
    <Toaster rich-colors position="top-right" />
  </template>
</template>
```

### 3.2. Маршрутизация

`src/router/index.ts` - основные маршруты:
```typescript
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue'),
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/projects/ProjectsView.vue'),
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('@/views/projects/ProjectDetailView.vue'),
    },
    // ... другие маршруты
  ],
})
```

### 3.3. Хранилища (Pinia)

`src/stores/projects.store.ts` - управление проектами, страницами и макетами:
```typescript
export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const pages = ref<Page[]>([])
  const layouts = ref<Layout[]>([])
  const activeProjectId = ref<string | null>(null)
  
  // Методы для загрузки, создания, обновления и удаления сущностей
  return {
    projects, pages, layouts, activeProjectId,
    loadProjects, createProject, updateProject, deleteProject,
    loadPages, createPage, updatePage, deletePage,
    loadLayouts, createLayout, updateLayout, deleteLayout,
  }
})
```

`src/stores/widget-builder.store.ts` - управление редактором виджетов:
```typescript
export const useWidgetBuilderStore = defineStore('widgetBuilder', () => {
  const widget = ref<WidgetDefinition | null>(null)
  const selectedId = ref<string | null>(null)
  const isDirty = ref(false)
  
  // Методы для работы с деревом виджетов
  return {
    widget, selectedId, isDirty,
    load, save, select, $reset,
    updateProps, renameNode,
    addChild, addSibling, deleteNode, moveUp, moveDown,
  }
})
```

### 3.4. Типы данных

`src/types/projects.ts` - основные типы проектов:
```typescript
export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Page {
  id: string
  projectId: string
  name: string
  slug: string
  layoutId?: string
  content: Record<string, { widgetId: string; order: number }[]>
  isPublished: boolean
  createdAt: string
  updatedAt: string
}
```

`src/types/widget-builder.ts` - типы виджетов:
```typescript
export type WidgetType = 'Column' | 'Row' | 'Container' | 'Text' | 'Button' | 'TextField' | 'RichText' | 'ListView'

export interface WidgetNode {
  id: string
  type: WidgetType
  name: string
  props: WidgetNodeProps
  children: WidgetNode[]
}

export interface WidgetNodeProps {
  // Sizing
  width: SizeValue
  height: SizeValue
  // Spacing
  padding: SpacingSide
  margin: SpacingSide
  // Colors
  backgroundColor: string
  color: string
  // Border
  border: BorderProps
  borderRadius: BorderRadiusProps
  // Flex (Column / Row / Container)
  flex?: FlexProps
  // Typography (Text / Button / TextField / RichText)
  typography?: TypographyProps
  // Content
  text?: string
  placeholder?: string
  richSpans?: RichTextSpan[]
  // ListView-specific config
  listViewConfig?: ListViewConfig
}
```

### 3.5. Компоненты пользовательского интерфейса

`src/components/widget-builder/CanvasNode.vue` - рендерер виджетов в редакторе:
```vue
<template>
  <!-- Column / Row / Container -->
  <div
    v-if="node.type === 'Column' || node.type === 'Row' || node.type === 'Container'"
    :style="nodeStyle"
    :class="isSelected ? 'outline outline-2 outline-blue-500' : ''"
    @click="onClick"
  >
    <CanvasNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :editor-mode="editorMode"
    />
  </div>

  <!-- Text -->
  <span
    v-else-if="node.type === 'Text'"
    :style="nodeStyle"
    :class="isSelected ? 'outline outline-2 outline-blue-500' : ''"
    @click="onClick"
  >{{ node.props.text || '' }}</span>

  <!-- Другие типы элементов... -->
</template>
```

`src/components/widgets/PreviewNode.vue` - рендерер виджетов в режиме предпросмотра:
```vue
<template>
  <!-- Column / Row / Container -->
  <div
    v-if="node.type === 'Column' || node.type === 'Row' || node.type === 'Container'"
    :style="nodeStyle()"
  >
    <PreviewNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
    />
  </div>

  <!-- Text -->
  <span
    v-else-if="node.type === 'Text'"
    :style="nodeStyle()"
  >{{ node.props.text || '' }}</span>

  <!-- Другие типы элементов... -->
</template>
```

### 3.6. Воркфлоу и действия

`src/types/actions.ts` - типы действий:
```typescript
export type ActionType =
  | 'visibility.show'
  | 'visibility.hide'
  | 'visibility.toggle'
  | 'navigation.navigate'
  | 'navigation.back'
  | 'data.fetch'
  | 'data.create'
  | 'data.update'
  | 'data.delete'
  | 'state.set'
  | 'state.clear'
  | 'ui.showToast'
  | 'ui.showModal'
  | 'ui.scrollTo'
  | 'custom.code'

export interface ActionStep {
  id: string
  type: ActionType
  label?: string
  config: Record<string, unknown>
  conditions?: Condition[]
  onSuccess?: ActionStep[]
  onError?: ActionStep[]
}
```

`src/services/ActionService.ts` - выполнение действий:
```typescript
async function runAction(step: ActionStep, context: ActionContext): Promise<void> {
  const cfg = step.config

  switch (step.type) {
    // ── Visibility ──────────────────────────────────────────────────────────
    case 'visibility.show':
      visibilityService.show(cfg.elementId as string)
      break

    case 'visibility.hide':
      visibilityService.hide(cfg.elementId as string)
      break

    case 'visibility.toggle':
      visibilityService.toggle(cfg.elementId as string)
      break

    // ── Navigation ──────────────────────────────────────────────────────────
    case 'navigation.navigate':
      eventService.emit('navigate', { url: cfg.url, pageId: cfg.pageId })
      break

    // ── Data ────────────────────────────────────────────────────────────────
    case 'data.fetch': {
      const resp = await fetch(cfg.endpoint as string, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`)
      const data = await resp.json()
      if (cfg.storeKey) globalState[cfg.storeKey as string] = data
      eventService.emit('data:fetched', { key: cfg.storeKey, data })
      break
    }

    // ── State ───────────────────────────────────────────────────────────────
    case 'state.set':
      globalState[cfg.key as string] = cfg.value
      context.state[cfg.key as string] = cfg.value
      eventService.emit('state:set', { key: cfg.key, value: cfg.value })
      break

    // ── UI ──────────────────────────────────────────────────────────────────
    case 'ui.showToast':
      eventService.emit('ui:toast', {
        message: cfg.message,
        type: cfg.toastType ?? 'default',
        duration: cfg.duration ?? 3000,
      })
      break

    // ── Custom ──────────────────────────────────────────────────────────────
    case 'custom.code': {
      const sandbox = {
        context,
        state: globalState,
        visibility: visibilityService,
        events: eventService,
        console,
      }
      const fn = new Function(...Object.keys(sandbox), `"use strict";\n${cfg.code as string}`)
      await fn(...Object.values(sandbox))
      break
    }

    default:
      console.warn(`[ActionService] Unknown action type: ${(step as ActionStep).type}`)
  }
}
```

## 4. Паттерны проектирования

### 4.1. Хранилища Pinia
Все данные приложения управляются через Pinia stores, которые следуют паттерну:
- Состояние определяется через ref/computed
- Методы для изменения состояния
- Асинхронные операции для работы с API

### 4.2. Компоненты Vue
Компоненты следуют паттерну:
- `<script setup lang="ts">` для логики
- `<template>` для разметки
- Использование composables для переиспользуемой логики

### 4.3. Сервисы
Сервисы инкапсулируют бизнес-логику:
- ActionService - выполнение действий
- EventService - шина событий
- VisibilityService - управление видимостью элементов
- WorkflowService - работа с воркфлоу

## 5. Работа с данными

### 5.1. Supabase
Все данные хранятся в Supabase с префиксом таблиц `ff_`:
- `ff_projects` - проекты
- `ff_layouts` - макеты страниц
- `ff_pages` - страницы
- `ff_widgets` - виджеты
- `ff_workflows` - воркфлоу

### 5.2. Типы данных
Все данные строго типизированы через TypeScript интерфейсы в `src/types/`.

## 6. Стилизация

### 6.1. Tailwind CSS
Проект использует Tailwind CSS v4 с CSS-переменными для темизации.

### 6.2. Темы
Темы управляются через composable `useTheme()`:
```typescript
const { isDark, toggleTheme } = useTheme()
```

## 7. Рекомендации для разработки

1. Всегда используйте TypeScript строгой типизации
2. Следуйте структуре проекта и именованию файлов
3. Используйте Pinia stores для управления состоянием
4. Используйте shadcn-vue компоненты для UI
5. Пишите документацию на русском языке
6. Тестируйте изменения через `pnpm build`