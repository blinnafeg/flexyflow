import type { ActionDefinition } from '@/types'

export const BUILT_IN_ACTIONS: ActionDefinition[] = [
  // ── Visibility ─────────────────────────────────────────────────────────────
  {
    type: 'visibility.show',
    category: 'visibility',
    label: 'Показать элемент',
    description: 'Делает элемент видимым на странице',
    icon: 'Eye',
    configFields: [
      { key: 'elementId', label: 'ID элемента', type: 'elementId', required: true, placeholder: 'my-element' },
    ],
  },
  {
    type: 'visibility.hide',
    category: 'visibility',
    label: 'Скрыть элемент',
    description: 'Скрывает элемент со страницы',
    icon: 'EyeOff',
    configFields: [
      { key: 'elementId', label: 'ID элемента', type: 'elementId', required: true, placeholder: 'my-element' },
    ],
  },
  {
    type: 'visibility.toggle',
    category: 'visibility',
    label: 'Переключить видимость',
    description: 'Переключает видимость элемента',
    icon: 'ToggleLeft',
    configFields: [
      { key: 'elementId', label: 'ID элемента', type: 'elementId', required: true, placeholder: 'my-element' },
    ],
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  {
    type: 'navigation.navigate',
    category: 'navigation',
    label: 'Перейти на страницу',
    description: 'Навигация к другой странице или URL',
    icon: 'Navigation',
    configFields: [
      { key: 'url', label: 'URL', type: 'text', placeholder: '/about или https://example.com' },
      { key: 'pageId', label: 'Страница проекта', type: 'pageId' },
    ],
  },
  {
    type: 'navigation.back',
    category: 'navigation',
    label: 'Назад',
    description: 'Вернуться на предыдущую страницу',
    icon: 'ArrowLeft',
    configFields: [],
  },

  // ── Data ───────────────────────────────────────────────────────────────────
  {
    type: 'data.fetch',
    category: 'data',
    label: 'Загрузить данные',
    description: 'Выполняет GET-запрос и сохраняет результат',
    icon: 'Download',
    configFields: [
      { key: 'endpoint', label: 'URL эндпоинта', type: 'text', required: true, placeholder: 'https://api.example.com/items' },
      { key: 'storeKey', label: 'Ключ для сохранения', type: 'text', placeholder: 'myData' },
    ],
  },
  {
    type: 'data.create',
    category: 'data',
    label: 'Создать запись',
    description: 'Отправляет POST-запрос для создания записи',
    icon: 'Plus',
    configFields: [
      { key: 'endpoint', label: 'URL эндпоинта', type: 'text', required: true },
      { key: 'body', label: 'Тело запроса (JSON)', type: 'code', placeholder: '{"name": "..."}' },
    ],
  },
  {
    type: 'data.update',
    category: 'data',
    label: 'Обновить запись',
    description: 'Отправляет PATCH/PUT-запрос для обновления записи',
    icon: 'Pencil',
    configFields: [
      { key: 'endpoint', label: 'URL эндпоинта', type: 'text', required: true },
      {
        key: 'method',
        label: 'Метод',
        type: 'select',
        options: [{ label: 'PATCH', value: 'PATCH' }, { label: 'PUT', value: 'PUT' }],
      },
      { key: 'body', label: 'Тело запроса (JSON)', type: 'code', placeholder: '{"name": "..."}' },
    ],
  },
  {
    type: 'data.delete',
    category: 'data',
    label: 'Удалить запись',
    description: 'Отправляет DELETE-запрос',
    icon: 'Trash2',
    configFields: [
      { key: 'endpoint', label: 'URL эндпоинта', type: 'text', required: true },
    ],
  },

  // ── State ──────────────────────────────────────────────────────────────────
  {
    type: 'state.set',
    category: 'state',
    label: 'Установить переменную',
    description: 'Сохраняет значение в хранилище состояния',
    icon: 'Variable',
    configFields: [
      { key: 'key', label: 'Ключ', type: 'text', required: true, placeholder: 'myVar' },
      { key: 'value', label: 'Значение', type: 'text', required: true, placeholder: '"hello" или 42' },
    ],
  },
  {
    type: 'state.clear',
    category: 'state',
    label: 'Очистить переменную',
    description: 'Удаляет значение из хранилища состояния',
    icon: 'Eraser',
    configFields: [
      { key: 'key', label: 'Ключ (пусто = всё)', type: 'text', placeholder: 'myVar' },
    ],
  },

  // ── UI ─────────────────────────────────────────────────────────────────────
  {
    type: 'ui.showToast',
    category: 'ui',
    label: 'Показать уведомление',
    description: 'Отображает всплывающее уведомление',
    icon: 'Bell',
    configFields: [
      { key: 'message', label: 'Сообщение', type: 'text', required: true, placeholder: 'Готово!' },
      {
        key: 'toastType',
        label: 'Тип',
        type: 'select',
        options: [
          { label: 'Обычное', value: 'default' },
          { label: 'Успех', value: 'success' },
          { label: 'Ошибка', value: 'error' },
          { label: 'Предупреждение', value: 'warning' },
        ],
      },
    ],
  },
  {
    type: 'ui.showModal',
    category: 'ui',
    label: 'Показать модал',
    description: 'Открывает модальное окно',
    icon: 'Square',
    configFields: [
      { key: 'modalId', label: 'ID модала', type: 'elementId', required: true },
      { key: 'title', label: 'Заголовок', type: 'text' },
    ],
  },
  {
    type: 'ui.scrollTo',
    category: 'ui',
    label: 'Прокрутить к элементу',
    description: 'Прокручивает страницу к указанному элементу',
    icon: 'ChevronsDown',
    configFields: [
      { key: 'elementId', label: 'ID элемента', type: 'elementId', required: true },
    ],
  },

  // ── Custom ─────────────────────────────────────────────────────────────────
  {
    type: 'custom.code',
    category: 'custom',
    label: 'Произвольный код',
    description: 'Выполняет пользовательский JavaScript-код',
    icon: 'Code2',
    configFields: [
      {
        key: 'code',
        label: 'Код',
        type: 'code',
        required: true,
        placeholder: '// context, state, visibility, events доступны\nconsole.log("hello")',
        description: 'Доступны: context, state, visibility, events, console',
      },
    ],
  },
]

export const ACTIONS_BY_CATEGORY = BUILT_IN_ACTIONS.reduce<Record<string, ActionDefinition[]>>((acc, def) => {
  if (!acc[def.category]) acc[def.category] = []
  acc[def.category].push(def)
  return acc
}, {})

export function getActionDef(type: string): ActionDefinition | undefined {
  return BUILT_IN_ACTIONS.find(d => d.type === type)
}
