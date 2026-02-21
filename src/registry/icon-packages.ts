import * as LucideIcons from 'lucide-vue-next'
import type { Component } from 'vue'

export interface IconPackage {
  id: string
  name: string
  url: string
  icons: Record<string, Component>
}

// Lucide экспортирует не только иконки, но и служебные объекты с PascalCase именами.
// Исключаем их явно: Icon — базовый компонент (не SVG-иконка), IconNode — тип.
const LUCIDE_NON_ICONS = new Set(['Icon', 'IconNode'])

const lucideIcons: Record<string, Component> = Object.fromEntries(
  Object.entries(LucideIcons).filter(
    ([name]) => /^[A-Z]/.test(name) && !LUCIDE_NON_ICONS.has(name)
  )
) as Record<string, Component>

/**
 * Реестр пакетов иконок.
 * Чтобы добавить новый пакет:
 *   1. pnpm add <package-name>
 *   2. import * as MyIcons from '<package-name>'
 *   3. Добавь объект в массив ниже
 */
export const iconPackages: IconPackage[] = [
  {
    id: 'lucide',
    name: 'Lucide Icons',
    url: 'https://lucide.dev',
    icons: lucideIcons,
  },
]

/** Найти Vue-компонент иконки по пакету и имени */
export function resolveIcon(
  packageId: string | undefined,
  iconName: string | undefined,
): Component | null {
  if (!packageId || !iconName) return null
  const pkg = iconPackages.find(p => p.id === packageId)
  return (pkg?.icons[iconName] as Component | undefined) ?? null
}
