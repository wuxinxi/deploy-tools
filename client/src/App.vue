<template>
  <div id="app">
    <el-container style="min-height: 100vh">
      <el-aside
        width="200px"
        class="aside-container"
      >
        <div class="logo">
          <el-icon class="logo-icon"><Cpu /></el-icon>
          <span class="logo-text">运维部署工具</span>
        </div>
        <el-menu
          default-active="home"
          class="el-menu-vertical-demo"
          @select="handleMenuSelect"
        >
          <el-menu-item index="home">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="servers">
            <el-icon><Connection /></el-icon>
            <span>服务器管理</span>
          </el-menu-item>
          <el-sub-menu index="deploy">
            <template #title>
              <el-icon><Monitor /></el-icon>
              <span>应用部署</span>
            </template>
            <el-menu-item index="deploy-backend">后端部署</el-menu-item>
            <el-menu-item index="deploy-frontend">前端部署</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="logs">
            <el-icon><Document /></el-icon>
            <span>部署日志</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="header-container">
          <div class="header-right">
            <el-dropdown>
              <span class="user-info">
                <el-avatar :size="32">
                  <User />
                </el-avatar>
                <span class="username">管理员</span>
                <el-icon class="arrow-icon"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>个人中心</el-dropdown-item>
                  <el-dropdown-item>设置</el-dropdown-item>
                  <el-dropdown-item divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main-content">
          <router-view />
        </el-main>

        <el-footer class="footer-container">
          <p>运维自动化部署工具 &copy; 2023</p>
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import {
  ArrowDown,
  Connection,
  Cpu,
  Document,
  House,
  Monitor,
  User,
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const handleMenuSelect = (index) => {
  // 根据菜单索引导航到对应的路由
  const routeMap = {
    home: '/',
    servers: '/servers',
    'deploy-backend': '/deploy/backend',
    'deploy-frontend': '/deploy/frontend',
    logs: '/logs',
  }

  const routePath = routeMap[index]
  if (routePath) {
    router.push(routePath)
  }
}
</script>

<style scoped>
.aside-container {
  background-color: #001529;
  color: #fff;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
}

.logo {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 64px;
  border-bottom: 1px solid #27272a;
}

.logo-icon {
  font-size: 24px;
  margin-right: 10px;
  color: #409eff;
}

.logo-text {
  font-size: 18px;
  font-weight: 500;
}

.el-menu-vertical-demo {
  background-color: #001529;
  border-right: none;
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
}

.el-menu-item,
.el-sub-menu__title {
  color: rgba(255, 255, 255, 0.7);
  height: 50px;
  line-height: 50px;
}

.el-menu-item:hover,
.el-sub-menu__title:hover {
  background-color: #1890ff;
  color: #fff;
}

.el-menu-item.is-active {
  background-color: #1890ff;
  color: #fff;
}

.header-container {
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.username {
  margin: 0 10px;
  font-size: 14px;
}

.arrow-icon {
  font-size: 16px;
  color: #666;
}

.main-content {
  padding: 0;
  background-color: #f5f7fa;
}

.footer-container {
  text-align: center;
  background-color: #fff;
  border-top: 1px solid #e5e7eb;
  padding: 10px 0;
}

.footer-container p {
  margin: 0;
  color: #666;
  font-size: 14px;
}
</style>
