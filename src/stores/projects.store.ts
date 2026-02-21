import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, Page, Layout } from '@/types'
import { supabase } from '@/lib/supabase'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const pages = ref<Page[]>([])
  const layouts = ref<Layout[]>([])
  const activeProjectId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeProject = computed(() =>
    projects.value.find(p => p.id === activeProjectId.value) ?? null
  )

  // ── Projects ────────────────────────────────────────────────────────────────

  async function loadProjects() {
    loading.value = true
    error.value = null
    try {
      const { data, error: e } = await supabase
        .from('ff_projects')
        .select('*')
        .order('created_at', { ascending: false })
      if (e) throw e
      projects.value = data.map(mapProject)
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createProject(name: string, description?: string): Promise<Project> {
    const { data, error: e } = await supabase
      .from('ff_projects')
      .insert({ name, description })
      .select()
      .single()
    if (e) throw e
    const proj = mapProject(data)
    projects.value.unshift(proj)
    return proj
  }

  async function updateProject(id: string, payload: Partial<Project>): Promise<void> {
    const { error: e } = await supabase
      .from('ff_projects')
      .update({ name: payload.name, description: payload.description })
      .eq('id', id)
    if (e) throw e
    const idx = projects.value.findIndex(p => p.id === id)
    if (idx !== -1) Object.assign(projects.value[idx], payload)
  }

  async function deleteProject(id: string): Promise<void> {
    const { error: e } = await supabase.from('ff_projects').delete().eq('id', id)
    if (e) throw e
    projects.value = projects.value.filter(p => p.id !== id)
  }

  // ── Pages ───────────────────────────────────────────────────────────────────

  async function loadPages(projectId: string) {
    const { data, error: e } = await supabase
      .from('ff_pages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (e) throw e
    pages.value = data.map(mapPage)
  }

  async function createPage(projectId: string, name: string, slug: string): Promise<Page> {
    const { data, error: e } = await supabase
      .from('ff_pages')
      .insert({ project_id: projectId, name, slug, content: {} })
      .select()
      .single()
    if (e) throw e
    const page = mapPage(data)
    pages.value.unshift(page)
    return page
  }

  async function updatePage(id: string, payload: Partial<Page>): Promise<void> {
    const { error: e } = await supabase
      .from('ff_pages')
      .update({
        name: payload.name,
        slug: payload.slug,
        layout_id: payload.layoutId,
        content: payload.content,
        is_published: payload.isPublished,
      })
      .eq('id', id)
    if (e) throw e
    const idx = pages.value.findIndex(p => p.id === id)
    if (idx !== -1) Object.assign(pages.value[idx], payload)
  }

  async function deletePage(id: string): Promise<void> {
    const { error: e } = await supabase.from('ff_pages').delete().eq('id', id)
    if (e) throw e
    pages.value = pages.value.filter(p => p.id !== id)
  }

  // ── Layouts ─────────────────────────────────────────────────────────────────

  async function loadLayouts(projectId: string) {
    const { data, error: e } = await supabase
      .from('ff_layouts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (e) throw e
    layouts.value = data.map(mapLayout)
  }

  async function createLayout(projectId: string, name: string): Promise<Layout> {
    const defaultConfig = {
      gridCols: 3,
      gridRows: 3,
      colWidths: ['1fr', '1fr', '1fr'],
      rowHeights: ['auto', '1fr', 'auto'],
      gap: '0px',
    }
    const { data, error: e } = await supabase
      .from('ff_layouts')
      .insert({ project_id: projectId, name, config: defaultConfig, slots: [] })
      .select()
      .single()
    if (e) throw e
    const layout = mapLayout(data)
    layouts.value.unshift(layout)
    return layout
  }

  async function updateLayout(id: string, payload: Partial<Layout>): Promise<void> {
    const { error: e } = await supabase
      .from('ff_layouts')
      .update({
        name: payload.name,
        config: payload.config,
        slots: payload.slots,
      })
      .eq('id', id)
    if (e) throw e
    const idx = layouts.value.findIndex(l => l.id === id)
    if (idx !== -1) Object.assign(layouts.value[idx], payload)
  }

  async function deleteLayout(id: string): Promise<void> {
    const { error: e } = await supabase.from('ff_layouts').delete().eq('id', id)
    if (e) throw e
    layouts.value = layouts.value.filter(l => l.id !== id)
  }

  // ── Mappers ──────────────────────────────────────────────────────────────────

  function mapProject(row: Record<string, unknown>): Project {
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  }

  function mapPage(row: Record<string, unknown>): Page {
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      name: row.name as string,
      slug: row.slug as string,
      layoutId: row.layout_id as string | undefined,
      content: (row.content as Record<string, { widgetId: string; order: number }[]>) ?? {},
      isPublished: (row.is_published as boolean) ?? false,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  }

  function mapLayout(row: Record<string, unknown>): Layout {
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      name: row.name as string,
      config: row.config as Layout['config'],
      slots: (row.slots as Layout['slots']) ?? [],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  }

  return {
    projects,
    pages,
    layouts,
    activeProjectId,
    activeProject,
    loading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    loadPages,
    createPage,
    updatePage,
    deletePage,
    loadLayouts,
    createLayout,
    updateLayout,
    deleteLayout,
  }
})
