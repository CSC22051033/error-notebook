import { createRouter, createWebHistory } from 'vue-router'
import ImportView from '../views/ImportView.vue'
import ListView from '../views/ListView.vue'
import PastListView from '../views/PastListView.vue'
import QuestionView from '../views/QuestionView.vue'

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
  },
  {
    path: '/past-list',
    name: 'PastList',
    component: PastListView
  },
  {
    path: '/questions/:id',
    name: 'Question',
    component: QuestionView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
