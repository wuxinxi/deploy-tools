import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ServerManager from '../views/ServerManager.vue'
import BackendDeploy from '../views/BackendDeploy.vue'
import FrontendDeploy from '../views/FrontendDeploy.vue'
import LogsView from '../views/LogsView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/servers',
    name: 'servers',
    component: ServerManager
  },
  {
    path: '/deploy/backend',
    name: 'backend-deploy',
    component: BackendDeploy
  },
  {
    path: '/deploy/frontend',
    name: 'frontend-deploy',
    component: FrontendDeploy
  },
  {
    path: '/logs',
    name: 'logs',
    component: LogsView
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
