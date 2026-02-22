import { createRouter, createWebHistory } from 'vue-router'

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
    {
      path: '/projects/:id/layouts',
      name: 'layouts',
      component: () => import('@/views/layouts/LayoutsView.vue'),
    },
    {
      path: '/layouts/:id/edit',
      name: 'layout-editor',
      component: () => import('@/views/layouts/LayoutEditorView.vue'),
    },
    {
      path: '/projects/:id/pages',
      name: 'pages',
      component: () => import('@/views/pages/PagesView.vue'),
    },
    {
      path: '/pages/:id/edit',
      name: 'page-editor',
      component: () => import('@/views/pages/PageEditorView.vue'),
    },
    {
      path: '/pages/:id/preview',
      name: 'page-preview',
      component: () => import('@/views/pages/PagePreviewView.vue'),
    },
    {
      path: '/workflows/:id',
      name: 'workflow-editor',
      component: () => import('@/views/workflows/WorkflowEditorView.vue'),
    },
    {
      path: '/projects/:id/workflows',
      name: 'workflows',
      component: () => import('@/views/workflows/WorkflowsView.vue'),
    },
    {
      path: '/projects/:id/widgets',
      name: 'widgets',
      component: () => import('@/views/widgets/WidgetsView.vue'),
    },
    {
      path: '/widgets/:id/edit',
      name: 'widget-editor',
      component: () => import('@/views/widgets/WidgetEditorView.vue'),
    },
    {
      path: '/projects/:id/colors',
      name: 'project-colors',
      component: () => import('@/views/projects/ProjectColorsView.vue'),
    },
  ],
})

export default router
