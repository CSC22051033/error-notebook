import { createRouter, createWebHistory } from 'vue-router'
import ImportView from '../views/ImportView.vue'
import ListView from '../views/ListView.vue'

const routes = [
  {
    path: '/'
  },
  {
    path: '/import',
    name: 'Import',
    component: ImportView
  },
    {
    path: '/list',
    name: 'List',
    component: ListView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
