import { createRouter, createWebHistory } from 'vue-router'

import PublicView from './views/PublicView.vue'
import AdminView from './views/AdminView.vue'

const routes = [
  { path: '/', component: PublicView },
  { path: '/admin', component: AdminView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router