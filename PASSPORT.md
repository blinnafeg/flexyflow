# FLEXYFLOW — Паспорт проекта

> **Для AI-агентов:** Этот файл — главный источник истины о проекте.
> Читай его ПЕРЕД тем как писать любой код. Обновляй его ПОСЛЕ каждого значимого изменения.

---

## Обзор проекта

**FlexyFlow** — визуальный конструктор страниц с системой действий и воркфлоу (аналог FlutterFlow).
Проект находится в `C:\Projects\flexyflow`.

**Назначение:** Позволяет создавать проекты → макеты страниц (grid-based) → страницы → назначать виджеты в слоты → добавлять интерактивное поведение через воркфлоу.

---

## Стек

| Слой | Технология | Версия |
|---|---|---|
| Фреймворк | Vue 3 (Composition API, `<script setup>`) | ^3.5 |
| Язык | TypeScript (strict mode) | ~5.9 |
| Сборщик | Vite | ^7 |
| CSS | Tailwind CSS v4 (CSS-native, без config-файла) | ^4.2 |
| UI компоненты | shadcn-vue (поверх reka-ui / radix-vue) | latest |
| Состояние | Pinia | ^3 |
| Роутер | Vue Router 4 | ^4.6 |
| БД / API | Supabase (self-hosted) | ^2 |
| Иконки | lucide-vue-next | ^0.575 |
| Уведомления | vue-sonner (toast через `import { toast } from 'vue-sonner'`) | ^2 |
| Утилиты | @vueuse/core, nanoid, clsx, tailwind-merge | latest |
| Пакетный менеджер | pnpm | — |

---

## Окружение

```
VITE_SUPABASE_URL=https://base.nkcloud.store
VITE_SUPABASE_ANON_KEY=eyJ...
```

Файл `.env` уже создан в корне проекта. `.env.example` — шаблон.

**Supabase:** self-hosted, таблицы с префиксом `ff_`. JWT_SECRET известен, service_role JWT можно сгенерировать при необходимости (см. историю).

---

## Структура файлов

```
src/
├── assets/
│   └── index.css              # Tailwind v4 + @theme inline + CSS переменные темы + --canvas-bg
├── components/
│   ├── AppSidebar.vue         # Боковая навигация + переключатель темы (Moon/Sun)
│   ├── actions/
│   │   ├── ActionBuilder.vue  # Главный компонент: триггер + список шагов
│   │   ├── ActionPalette.vue  # Sheet с выбором типа действия по категориям
│   │   └── ActionStep.vue     # Карточка одного шага с конфиг-формой
│   ├── layout/
│   │   └── GridBuilder.vue    # Визуальный редактор CSS-сетки
│   ├── widget-builder/
│   │   ├── CanvasNode.vue         # Рекурсивный рендерер ноды (ТОЛЬКО для editor mode) + ListView placeholder
│   │   ├── WidgetCanvas.vue       # Canvas обёртка с click-to-deselect
│   │   ├── WidgetTreePanel.vue    # Левая панель: палитра + дерево + секция «Данные» для list-item
│   │   ├── PropertiesPanel.vue    # Правая панель: Layout|Style|Content|Data; для ListView — конфиг
│   │   ├── ListViewConfigPanel.vue # Конфигурация ListView ноды: источник, фильтры, сортировка, пагинация
│   │   ├── DataBindingPanel.vue   # Привязка полей данных к элементам виджета (для list-item режима)
│   │   └── properties/
│   │       ├── SizeSection.vue
│   │       ├── SpacingSection.vue
│   │       ├── BorderSection.vue
│   │       ├── ColorsSection.vue
│   │       ├── TypographySection.vue
│   │       ├── FlexSection.vue
│   │       └── ContentSection.vue
│   ├── widgets/
│   │   ├── PreviewNode.vue        # Рекурсивный рендерер для публичного просмотра (runtime, без editor режима)
│   │   │                          # Для ListView: загружает данные из Supabase, применяет dataBindings, рендерит строки
│   │   └── WidgetRenderer.vue     # Умная обёртка: загружает виджет по ID (v1/v2 формат), рендерит через PreviewNode
│   └── ui/                    # shadcn-vue компоненты (не редактировать вручную)
├── composables/
│   ├── useTheme.ts            # Тема (dark/light): singleton ref + localStorage + watchEffect
│   ├── useWidgetCss.ts        # nodeToStyle() — CSS из WidgetNodeProps для :style биндинга
│   └── useWidgetTree.ts       # Tree операции: createDefaultNode, findNode, removeNode, ...
├── services/
│   ├── ActionService.ts
│   ├── DataSourceService.ts   # Supabase: интроспекция колонок, fetchData с фильтрами/сортировкой
│   ├── EventService.ts
│   ├── VisibilityService.ts
│   └── WorkflowService.ts
├── lib/
│   ├── supabase.ts            # Supabase client (singleton)
│   └── utils.ts               # cn() = clsx + tailwind-merge
├── registry/
│   └── actions.registry.ts    # BUILT_IN_ACTIONS[] — метаданные всех типов действий
├── router/
│   └── index.ts               # Vue Router маршруты
├── services/
│   ├── ActionService.ts       # Выполнение одного шага (switch по типу)
│   ├── EventService.ts        # Event bus (on/off/emit/once)
│   ├── VisibilityService.ts   # Глобальный show/hide/toggle (Vue reactive)
│   └── WorkflowService.ts     # Supabase CRUD + executeWorkflow()
├── stores/
│   ├── builder.store.ts       # Текущий воркфлоу, выбранный слот/виджет, preview mode
│   ├── projects.store.ts      # CRUD: проекты, страницы, макеты
│   ├── visibility.store.ts    # Pinia-обёртка над VisibilityService
│   ├── widget-builder.store.ts # Редактор виджетов: flat Map index, O(1) доступ
│   └── workflows.store.ts     # CRUD воркфлоу + кэш
├── types/
│   ├── actions.ts             # TriggerType, ActionType, ActionStep, Workflow, ...
│   ├── layouts.ts             # GridSlot, LayoutConfig, Layout
│   ├── projects.ts            # Project, Page
│   ├── list-view.ts           # ListViewConfig, ListItemMeta, DataBinding, WidgetKind, ColumnInfo, ...
│   ├── widget-builder.ts      # WidgetNode, WidgetType (+ ListView), WidgetNodeProps (+ listViewConfig), ...
│   ├── widgets.ts             # WidgetElement, Widget, WidgetAssignment
│   └── index.ts               # re-exports всех типов
├── views/
│   ├── dashboard/DashboardView.vue
│   ├── projects/
│   │   ├── ProjectsView.vue       # Список проектов + создание
│   │   └── ProjectDetailView.vue  # Карточки: Макеты, Страницы, Виджеты, Воркфлоу
│   ├── layouts/
│   │   ├── LayoutsView.vue        # Список макетов проекта
│   │   └── LayoutEditorView.vue   # Редактор сетки (использует GridBuilder)
│   ├── pages/
│   │   ├── PagesView.vue          # Список страниц проекта
│   │   ├── PageEditorView.vue     # Редактор страницы + панель настроек + секция воркфлоу слота
│   │   └── PagePreviewView.vue    # Превью страницы
│   ├── workflows/
│   │   ├── WorkflowsView.vue      # Список воркфлоу проекта + создание + удаление
│   │   └── WorkflowEditorView.vue # Редактор воркфлоу (использует ActionBuilder)
│   └── widgets/
│       ├── WidgetsView.vue        # Список виджетов проекта + создание
│       └── WidgetEditorView.vue   # 3-колоночный редактор виджетов + линейка + зум
├── App.vue                    # Root: sidebar + <RouterView> + <Toaster> + инициализация темы
└── main.ts                    # Bootstrap: createApp + Pinia + Router
```

---

## База данных

Таблицы в Supabase (все с префиксом `ff_`):

| Таблица | Назначение | Ключевые поля |
|---|---|---|
| `ff_projects` | Проекты | id, name, description |
| `ff_layouts` | Макеты страниц | id, project_id, name, config (jsonb), slots (jsonb) |
| `ff_pages` | Страницы | id, project_id, name, slug, layout_id, content (jsonb), is_published |
| `ff_widgets` | Виджеты | id, project_id, name, elements (jsonb) |
| `ff_workflows` | Воркфлоу | id, project_id, name, trigger, steps (jsonb), widget_id, page_id |
| `ff_custom_actions` | Кастомные действия | id, project_id, name, code, inputs, outputs |

**Schema SQL:** `docs/schema.sql`

### Структура jsonb полей

**`ff_layouts.config`:**
```json
{
  "gridCols": 3,
  "gridRows": 3,
  "colWidths": ["1fr", "2fr", "1fr"],
  "rowHeights": ["auto", "1fr", "auto"],
  "gap": "0px"
}
```

**`ff_layouts.slots`:**
```json
[{ "id": "abc123", "name": "header", "label": "Шапка", "row": 1, "col": 1, "rowSpan": 1, "colSpan": 3 }]
```

**`ff_pages.content`:**
```json
{ "header": [{ "widgetId": "uuid", "order": 0 }] }
```

**`ff_workflows.steps`:**
```json
[{
  "id": "nanoid",
  "type": "visibility.show",
  "config": { "elementId": "my-block" },
  "conditions": [],
  "onSuccess": [],
  "onError": []
}]
```

---

## Маршруты

| Путь | View | Назначение |
|---|---|---|
| `/` | DashboardView | Дашборд со статистикой |
| `/projects` | ProjectsView | Список проектов |
| `/projects/:id` | ProjectDetailView | Детали проекта (4 карточки) |
| `/projects/:id/layouts` | LayoutsView | Макеты проекта |
| `/layouts/:id/edit` | LayoutEditorView | Редактор макета |
| `/projects/:id/pages` | PagesView | Страницы проекта |
| `/pages/:id/edit` | PageEditorView | Редактор страницы |
| `/pages/:id/preview` | PagePreviewView | Превью страницы |
| `/projects/:id/workflows` | WorkflowsView | Список воркфлоу проекта |
| `/workflows/:id` | WorkflowEditorView | Редактор воркфлоу |
| `/projects/:id/widgets` | WidgetsView | Список виджетов проекта |
| `/widgets/:id/edit` | WidgetEditorView | Редактор виджета (FlutterFlow-style) |

---

## Система действий (Action System)

### Типы триггеров (TriggerType)
`onClick`, `onSubmit`, `onInit`, `onChange`, `onHover`, `onPageLoad`, `onWidgetMount`

### Типы действий (ActionType) — 16 штук

| Категория | Типы |
|---|---|
| `visibility` | `visibility.show`, `visibility.hide`, `visibility.toggle` |
| `navigation` | `navigation.navigate`, `navigation.back` |
| `data` | `data.fetch`, `data.create`, `data.update`, `data.delete` |
| `state` | `state.set`, `state.clear` |
| `ui` | `ui.showToast`, `ui.showModal`, `ui.scrollTo` |
| `custom` | `custom.code` |

### Добавление нового типа действия

1. **`src/types/actions.ts`** — добавить строку в `ActionType` union
2. **`src/registry/actions.registry.ts`** — добавить объект `ActionDefinition` в `BUILT_IN_ACTIONS[]`
3. **`src/services/ActionService.ts`** — добавить `case 'category.type':` в switch внутри `runAction()`
4. Всё — UI (ActionPalette, ActionStep) подхватывает автоматически

### Схема воркфлоу
Воркфлоу = триггер + массив шагов. Шаги выполняются последовательно.
При успехе шага → `step.onSuccess[]`, при ошибке → `step.onError[]` (рекурсивно).

---

## Архитектурные правила

### 1. Supabase клиент
Всегда импортировать из `@/lib/supabase`:
```ts
import { supabase } from '@/lib/supabase'
```
Никогда не создавать `createClient()` повторно.

### 2. Типы
Все типы в `src/types/`. Импортировать через `@/types` (barrel export).
Никогда не писать `any` — использовать `unknown` с явным кастом.

### 3. UI компоненты
Использовать ТОЛЬКО shadcn-vue компоненты из `src/components/ui/`.
Не редактировать файлы в `src/components/ui/` вручную (они от shadcn-vue).

**Важный баг shadcn-vue (reka-ui):** `<SelectItem value="">` — пустая строка как value вызывает
 ошибка Vue при анмаунте ("Cannot read properties of null (reading 'type')").
Всегда использовать sentinel: `value="__none__"`.

### 4. CSS / Tailwind v4 — КРИТИЧНО

Tailwind v4 — конфиг ТОЛЬКО через CSS переменные в `src/assets/index.css`.
Нет `tailwind.config.ts`. Плагин: `@tailwindcss/postcss` (не `tailwindcss`).

**`@theme inline` — обязателен** для shadcn-vue цветов.
Без него `bg-popover`, `bg-card`, `bg-background` и все CSS-переменные-цвета разрешаются в `transparent`.
Блок должен быть в `index.css`:
```css
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-popover:    hsl(var(--popover));
  /* ... все остальные shadcn-vue токены ... */
}
```

**`@custom-variant dark` — обязателен** для класс-based dark mode.
В Tailwind v4 `dark:` по умолчанию реагирует на `prefers-color-scheme`, а НЕ на класс `.dark`.
Добавлять в начало `index.css`:
```css
@custom-variant dark (&:is(.dark *));
```

**Динамические размеры элементов:** Tailwind класс `h-px` может не работать для динамических
элементов с `:style` биндингом. Использовать inline `style="height:1px"`.

Не добавлять inline styles там, где можно обойтись классами Tailwind.

### 5. Тема (dark/light)
Composable `useTheme()` в `src/composables/useTheme.ts`:
- Singleton: module-level `ref<boolean>` — все вызовы `useTheme()` делят одно состояние
- Сохраняет в `localStorage` ключ `ff-theme` (`'dark'` | `'light'`)
- `watchEffect` синхронизирует `.dark` класс на `document.documentElement`
- Откатывается на `prefers-color-scheme` если ключа в localStorage нет

```ts
import { useTheme } from '@/composables/useTheme'
const { isDark, toggleTheme } = useTheme()
```

Для инициализации вызывается в `App.vue` (достаточно одного вызова при старте).

### 6. Пиксельная линейка (WidgetEditorView)
Crosshair линии в редакторе виджетов используют две системы координат:
- `linePos` — scroll-скорректированные, для `position: absolute` элементов внутри scroll-контейнера
- `clientXY` — сырые координаты мыши, для `position: fixed` бейджа с координатами
- `canvasPos` — координаты относительно холста с учётом зума (делим на `zoomNum`)

Линии должны быть **прямыми дочерними элементами** scroll-контейнера (`<main>`), НЕ внутри обёртки с `overflow-hidden`.

### 7. Pinia stores
- `projects.store.ts` — источник истины для projects/pages/layouts
- `workflows.store.ts` — источник истины для воркфлоу
- `builder.store.ts` — UI-состояние редактора (не персистируется)
- `visibility.store.ts` — видимость элементов на странице
- `widget-builder.store.ts` — состояние редактора виджетов

Всегда использовать stores для данных, а не локальные ref() с fetch.
Исключение: разовые загрузки внутри view (например, загрузка конкретного макета в LayoutEditorView).

### 8. Тосты
```ts
import { toast } from 'vue-sonner'
toast.success('Сохранено')
toast.error(e.message)
```

### 9. Именование
- Файлы компонентов: `PascalCase.vue`
- Файлы store: `kebab-case.store.ts`
- Файлы service: `PascalCase.ts` (класс или объект-синглтон)
- Файлы types: `kebab-case.ts`

### 10. Widget Builder — правила расширения

**Добавление нового типа виджета:**
1. `src/types/widget-builder.ts` — добавить строку в `WidgetType` union
2. `src/composables/useWidgetTree.ts` — добавить case в `DEFAULTS` (обязательно!) + в `canHaveChildren()` если нужно
3. `src/composables/useWidgetCss.ts` — при необходимости добавить CSS в `nodeToStyle()`
4. `src/components/widget-builder/CanvasNode.vue` — добавить `v-else-if` блок для рендера
5. `src/components/widget-builder/WidgetTreePanel.vue` — добавить иконку в `ICONS`/`ICONS_MAP` и запись в `PALETTE`

**ВАЖНО:** `DEFAULTS` — это `Record<WidgetType, ...>`. TypeScript требует покрытия всех значений union. Если добавил новый WidgetType, но не добавил его в DEFAULTS — будет ошибка компиляции.

**Важно для CanvasNode:**
- Используй `outline`, а не `border` для выделения — outline не влияет на layout
- Рекурсия через самореференцию в `<script setup>` работает нативно в Vue 3

**widget-builder.store:**
- Flat Map index пересчитывается через `watchEffect` при любом изменении дерева
- `updateProps(id, patch)` делает deep merge — поля вложенных объектов (border, flex, padding) нужно передавать целиком или частично через spread

### 11. Шаблоны Vue
- Всегда `v-if` перед работой с данными, которые могут быть `null`
- Не использовать `!` non-null assertion в шаблонах — использовать `?.` или `v-if` guard
- Проп `size="icon-sm"` есть у Button — работает (добавлен в `buttonVariants`)

### 12. Создание файлов
Всегда использовать `Write` tool для создания новых файлов.
Никогда не использовать Bash с `cat > file` или heredoc для записи файлов.

---

## Текущее состояние (что реализовано)

### Готово и работает ✅
- Проекты: создание, просмотр, удаление
- Макеты: создание, редактирование сетки (колонки/строки/gap), объединение ячеек, именование слотов
- Страницы: создание, назначение макета, переключение публикации
- Воркфлоу: список по проекту, создание (имя + триггер), удаление, редактор (триггер + шаги)
- ActionBuilder / ActionPalette / ActionStep — полный UI
- GridBuilder — визуальный редактор CSS grid с drag-free выбором ячеек
- VisibilityService — глобальный реактивный show/hide/toggle
- ActionService — выполнение всех 16 типов действий
- EventService — event bus для межкомпонентной коммуникации
- Supabase: подключение, все CRUD операции, БД схема создана
- **Тёмная тема** — переключатель в AppSidebar, сохранение в localStorage
- **Пиксельная линейка** — crosshair линии + координатный бейдж в WidgetEditorView
- **Зум холста** — Select 25%–200% в WidgetEditorView с компенсацией отступов
- **Воркфлоу слота** — в PageEditorView: список воркфлоу виджета + кнопка создания

### Готово и работает ✅ (widget builder)
- Конструктор виджетов (FlutterFlow-style): 3 колонки — Дерево | Холст | Свойства
- Поддерживаемые виджеты: Column, Row, Container, Text, Button, TextField, RichText, **ListView**
- Свойства: размеры (px/%/auto), отступы (padding/margin per side), цвета, бордеры (per corner radius), типографика, flex layout
- Дерево: добавление, удаление, переименование, перемещение ↑↓, collapse
- Холст: чистый live-preview без лишних меток, outline-выделение выбранного
- Сохранение в Supabase `ff_widgets.elements` (v2-формат с метаданными)
- Ctrl+S для быстрого сохранения
- **ListView widget builder** — настройка источника данных, фильтров, сортировки, пагинации, шаблона
- **List Item mode** — пометить виджет как шаблон списка, задать источник, привязать поля к узлам
- **ListView рантайм** — `PreviewNode.vue` + `WidgetRenderer.vue`: реальный рендер строк из Supabase на странице
- **PagePreviewView** — обновлён: использует `WidgetRenderer`, поддерживает v1/v2 формат

### Не реализовано / следующие задачи ❌
- **Назначение виджетов в слоты** страницы (ff_pages.content) — прямое назначение в slot ещё нет
- **Публичный рендерер** (PublicPageView — рендер страницы для конечного пользователя)
- **Библиотека виджетов** с предустановленными элементами
- **Кастомные действия** (ff_custom_actions — таблица есть, UI нет)
- **Условия в шагах** (Condition UI в ActionStep — поля есть в типах, UI нет)
- **onSuccess/onError ветки** в ActionStep — типы есть, UI нет
- **Drag & drop** порядка шагов в ActionBuilder
- **Авторизация** (сейчас без RLS, anon key читает/пишет всё)

---

## Известные ошибки и их решения

### TypeError: Cannot read properties of null (reading 'type') — Vue unmount
**Причина:** `<SelectItem value="">` — reka-ui некорректно обрабатывает пустую строку.
**Решение:** Использовать `value="__none__"` и конвертировать в обработчике:
```vue
<Select
  :model-value="someId ?? '__none__'"
  @update:model-value="handler($event === '__none__' ? null : $event)"
>
  <SelectItem value="__none__">— Не выбрано —</SelectItem>
</Select>
```

### Supabase "Tenant or user not found" при прямом подключении pg
**Причина:** Порт 5432 смотрит на Supavisor (пулер), не на PostgreSQL напрямую.
**Решение:** Использовать pg-meta API (`/pg/query`) с service_role JWT.
Service_role JWT генерируется из JWT_SECRET через HMAC-SHA256.

### Tailwind v4 — классы не применяются
**Причина:** Нет `@tailwind base/components/utilities` в CSS (это v3 синтаксис).
**Решение:** Использовать только `@import "tailwindcss"` в `src/assets/index.css`.

### Tailwind v4 — `bg-popover`, `bg-card` и другие цвета прозрачные
**Причина:** shadcn-vue использует CSS-переменные (`hsl(var(--popover))`), но Tailwind v4
не связывает их с цветовыми токенами автоматически.
**Решение:** Добавить блок `@theme inline { --color-popover: hsl(var(--popover)); ... }` в `index.css`.

### Tailwind v4 — `dark:` классы не реагируют на класс `.dark`
**Причина:** В Tailwind v4 `dark:` по умолчанию привязан к `prefers-color-scheme`, а не к `.dark`.
**Решение:** Добавить в начало `index.css`:
```css
@custom-variant dark (&:is(.dark *));
```

### Crosshair линейка — линии не видны
**Причина:** Линии внутри обёртки с `overflow-hidden` обрезаются. При `position: absolute; inset: 0`
внутри `overflow: auto` контейнера элемент скроллится вместе с содержимым.
**Решение:** Линии — прямые дочерние элементы scroll-контейнера (`<main>`).
Координаты корректировать на `scrollLeft`/`scrollTop`. Бейдж с координатами — `position: fixed`.

---

## Changelog

### 2026-02-20 — Начальная реализация (AI: Claude Sonnet 4.6)
- Создан проект Vite + Vue 3 + TypeScript
- Настроен Tailwind v4, shadcn-vue, Pinia, Vue Router
- Написаны все TypeScript типы (actions, layouts, widgets, projects)
- Написаны сервисы: EventService, VisibilityService, ActionService, WorkflowService
- Реестр действий BUILT_IN_ACTIONS (16 типов, 6 категорий)
- Pinia stores: visibility, workflows, builder, projects
- Компоненты: ActionBuilder, ActionPalette, ActionStep, GridBuilder, AppSidebar
- Views: Dashboard, Projects, ProjectDetail, Layouts, LayoutEditor, Pages, PageEditor, WorkflowEditor
- Создана БД схема `docs/schema.sql`, таблицы применены через pg-meta API
- Настроен .env с Supabase credentials

### 2026-02-20 — Конструктор виджетов (AI: Claude Sonnet 4.6)
- Добавлен FlutterFlow-style widget builder (3 колонки)
- Новые типы: `src/types/widget-builder.ts` (WidgetNode, WidgetNodeProps, FlexProps, etc.)
- Новые composables: `useWidgetCss.ts` (nodeToStyle), `useWidgetTree.ts` (tree ops)
- Новый store: `widget-builder.store.ts` с flat Map index для O(1) доступа
- Компоненты: CanvasNode (рекурсивный), WidgetCanvas, WidgetTreePanel, PropertiesPanel
- 7 property секций: Size, Spacing, Border, Colors, Typography, Flex, Content
- Views: WidgetsView (список), WidgetEditorView (3-колоночный редактор)
- Добавлены маршруты `/projects/:id/widgets` и `/widgets/:id/edit`
- Добавлена карточка "Виджеты" в ProjectDetailView
- build: ✅ 0 ошибок TypeScript

### 2026-02-20 — Настройки страницы (AI: Claude Sonnet 4.6)
- Добавлена панель настроек в PageEditorView (кнопка ⚙)
- Реализован выбор макета для страницы (Select + мгновенное сохранение в БД)
- Добавлено переключение публикации страницы
- Исправлена ошибка `<SelectItem value="">` → использование sentinel `"__none__"`
- Добавлен guard `v-if="settingsOpen && page"` для безопасного рендера панели

### 2026-02-21 — ListView / List Item (AI: Claude Sonnet 4.6)
- **Новый тип виджета `ListView`**: источник данных, фильтры, сортировка, пагинация, выбор шаблона
- **Режим `list-item`**: любой виджет можно пометить кнопкой «List» в toolbar; сохраняется в `elements.widgetKind`
- **Привязка данных**: вкладка «Data» в PropertiesPanel для Text/Button/TextField — биндинг к полям таблицы
- **`DataSourceService`**: интроспекция колонок через sample-row (без pg-meta); фильтры/сортировка через Supabase query builder
- **v2 формат `ff_widgets.elements`**: `{ v: 2, root, widgetKind, listItemMeta }` — backward-compatible с v1 (массив)
- **Store**: `widgetKind`, `listItemMeta`, `setWidgetKind()`, `updateListItemMeta()`, `setDataBinding()`, `removeDataBinding()`
- Новые файлы: `src/types/list-view.ts`, `src/services/DataSourceService.ts`, `ListViewConfigPanel.vue`, `DataBindingPanel.vue`
- Левая панель: при list-item режиме показывает поле «Таблица источника» внизу
- Правая панель: для ListView-ноды показывает `ListViewConfigPanel` вместо стандартных табов
- build: ✅ 0 ошибок TypeScript (2446 модулей)

### 2026-02-21 — ListView рантайм / PagePreview (AI: Claude Sonnet 4.6)
- **`PreviewNode.vue`** (`src/components/widgets/`) — рекурсивный рендерер для публичного просмотра:
  - Column/Row/Container/Text/Button/TextField/RichText — рендер без editor-режима
  - `ListView` — загружает строки из Supabase (с фильтрами/сортировкой/пагинацией), загружает виджет-шаблон однократно, применяет `dataBindings` к каждой строке (`applyBindings()`) и рендерит `PreviewNode` на строку
- **`WidgetRenderer.vue`** (`src/components/widgets/`) — умная обёртка:
  - Загружает `ff_widgets.elements` по `widgetId`
  - Разбирает v1 (массив) и v2 (`{ v:2, root, widgetKind, listItemMeta }`) форматы
  - Рендерит через `PreviewNode`
- **`PagePreviewView.vue`** — переписан: хранит `slotName → widgetId`, рендерит `<WidgetRenderer>` в каждый слот; вся логика парсинга формата делегирована `WidgetRenderer`
- build: ✅ 0 ошибок TypeScript

### 2026-02-21 — Тема, линейка, воркфлоу (AI: Claude Sonnet 4.6)
- **Исправлен** баг прозрачных dropdown/popover/card — добавлен `@theme inline` в `index.css`
- **Добавлена тёмная тема:** composable `useTheme.ts` (singleton + localStorage), Moon/Sun в AppSidebar
- **Исправлена** поддержка `dark:` классов — добавлен `@custom-variant dark (&:is(.dark *))` в CSS
- **Добавлен фон холста** — CSS переменная `--canvas-bg` для light (`#dde3ec`) и dark (`#0d1117`)
- **Добавлена пиксельная линейка** в WidgetEditorView: crosshair + координатный бейдж
- **Добавлен зум холста** — Select 25%–200% с ResizeObserver для компенсации отступов
- **WorkflowsView** — новый view для списка воркфлоу проекта (создание, удаление)
- **Маршрут** `/projects/:id/workflows` добавлен в router
- **ProjectDetailView** — добавлена карточка "Воркфлоу" (Zap icon, синяя)
- **PageEditorView** — секция "Действия" в панели слота: список воркфлоу виджета + создание
- build: ✅ 0 ошибок TypeScript

---

## Инструкции для следующего AI

1. **Прочитай этот файл полностью** перед началом работы
2. **Прочитай нужные файлы** перед их редактированием (`Read` tool)
3. **Запускай `pnpm build`** после значимых изменений для проверки TypeScript
4. **Не трогай `src/components/ui/`** — shadcn-vue компоненты не редактируются вручную
5. **Используй `toast` из `vue-sonner`** для всех уведомлений пользователю
6. **Обновляй секцию Changelog** в этом файле после каждого изменения
7. **Обновляй секции "Готово" / "Не реализовано"** при добавлении функций
8. **Пиши на русском** в UI (labels, placeholders, уведомления)
9. **Избегай `any`** — TypeScript strict mode включён
10. **При добавлении нового типа действия** — следуй 4-шаговому процессу выше
11. **При добавлении нового типа виджета** — следуй 5-шаговому процессу в правиле 10
12. **Для dark mode** — `@custom-variant dark` + `@theme inline` ОБЯЗАТЕЛЬНЫ в `index.css`
13. **Для создания файлов** — использовать `Write` tool, не Bash heredoc
14. **Editor vs Preview рендер** — два разных компонента:
    - `CanvasNode.vue` — только для widget editor (editorMode, выделение, клик)
    - `PreviewNode.vue` — только для публичного просмотра страницы (никакого editorMode)
    - Никогда не смешивай их: не передавай `editorMode=false` в `CanvasNode` из PagePreview

---

## История изменений репозитория

### 2026-02-21 — Инициализация Git репозитория и подключение к GitHub
- Создан файл `.gitignore` с настройками для игнорирования конфиденциальных данных и временных файлов
- Инициализирован Git репозиторий и добавлены все файлы проекта
- Создан первый коммит с сообщением "Initial commit: FlexyFlow project"
- Подключен удаленный репозиторий на GitHub
- Загружены все файлы проекта в удаленный репозиторий
- Созданы инструкции по работе с Git и GitHub (`GITHUB_INSTRUCTIONS.md`)
- Созданы рекомендации по безопасности репозитория (`SECURITY_RECOMMENDATIONS.md`)
- Проведен анализ безопасности репозитория

---

## Инструкции по работе с репозиторием

### Регулярное резервное копирование

Для регулярного резервного копирования проекта используйте следующие команды:

```bash
# Добавление изменений в репозиторий
git add .

# Создание коммита с осмысленным сообщением
git commit -m "Описание внесенных изменений"

# Отправка изменений в удаленный репозиторий
git push origin main
```

### Создание резервной копии локально

Для создания локальной резервной копии проекта выполните:

```bash
# Создание архива репозитория
git archive --format=zip --output=flexyflow-backup.zip main
```

### Дополнительные рекомендации

1. Используйте теги для обозначения важных версий:
   ```bash
   git tag -a v1.0.0 -m "Версия 1.0.0"
   git push origin v1.0.0
   ```

2. Создайте ветки для разработки новых функций:
   ```bash
   git checkout -b feature/new-feature
   # После завершения разработки
   git checkout main
   git merge feature/new-feature
   git push origin main
   ```

3. Регулярно синхронизируйте локальный репозиторий с удаленным:
   ```bash
   git pull origin main
   ```

Следуя этим инструкциям, вы сможете успешно поддерживать репозиторий проекта FlexyFlow в актуальном состоянии и обеспечить регулярное резервное копирование.
