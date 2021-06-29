import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Tabs from '../views/Tabs.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/Train'
  },
  {
    path: '/',
    component: Tabs,
    children: [
      {
        path: '',
        redirect: '/Train'
      },
      {
        path: 'Train',
        component: () => import('@/views/Train.vue')
      },
      {
        path: 'Leaderboard',
        component: () => import('@/views/Leaderboard.vue')
      },
      {
        path: 'Help',
        component: () => import('@/views/Help.vue')
      },
      {
        path: 'Settings',
        component: () => import('@/views/Settings.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
