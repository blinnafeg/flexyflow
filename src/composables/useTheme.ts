import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'ff-theme'

const isDark = ref<boolean>(
  localStorage.getItem(STORAGE_KEY) === 'dark' ||
  (!localStorage.getItem(STORAGE_KEY) && window.matchMedia('(prefers-color-scheme: dark)').matches)
)

// Apply class to <html> whenever isDark changes
watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
})

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  }

  function setTheme(dark: boolean) {
    isDark.value = dark
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  }

  return { isDark, toggleTheme, setTheme }
}
