import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '@/views/LandingPage.vue'
import DashboardPage from '@/views/DashboardPage.vue'
import EditorPage from '@/views/EditorPage.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage
  },
  {
    path: '/editor/:siteId',
    name: 'Editor',
    component: EditorPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
