import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ServerManager from '../views/ServerManager.vue'
import DeployBackend from '../views/DeployBackend.vue'
import DeployFrontend from '../views/DeployFrontend.vue'
import LogsView from '../views/LogsView.vue'
import NotFound from '../views/NotFound.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/servers',
      name: 'server-manager',
      component: ServerManager
    },
    {
      path: '/deploy/backend',
      name: 'deploy-backend',
      component: DeployBackend
    },
    {
      path: '/deploy/frontend',
      name: 'deploy-frontend',
      component: DeployFrontend
    },
    {
      path: '/logs',
      name: 'logs',
      component: LogsView
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound
    }
  ]
})

export default router
