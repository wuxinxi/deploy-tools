<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <div class="welcome-content">
        <h1>欢迎使用运维自动化部署工具</h1>
        <p class="description">
          该工具可以帮助您快速部署前端和后端应用，简化运维流程，提高工作效率
        </p>
        <div class="action-buttons">
          <el-button
            type="primary"
            size="large"
            @click="$router.push('/servers')"
            icon="Server"
          >
            服务器管理
          </el-button>
          <el-button
            type="success"
            size="large"
            @click="$router.push('/deploy/backend')"
            icon="HardDrive"
          >
            部署后端应用
          </el-button>
          <el-button
            type="info"
            size="large"
            @click="$router.push('/deploy/frontend')"
            icon="Monitor"
          >
            部署前端应用
          </el-button>
        </div>
      </div>
    </el-card>

    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon"><Operation /></el-icon>
          <div class="stat-info">
            <div class="stat-label">已配置服务器</div>
            <div class="stat-value">{{ serverCount }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon"><CircleCheck /></el-icon>
          <div class="stat-info">
            <div class="stat-label">成功部署</div>
            <div class="stat-value">{{ successCount }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon"><Clock /></el-icon>
          <div class="stat-info">
            <div class="stat-label">最近部署</div>
            <div class="stat-value">{{ lastDeploy || '暂无' }}</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { CircleCheck, Clock } from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue'
import { getLogs } from '../api/log'
import { getServers } from '../api/server'

const serverCount = ref(0)
const successCount = ref(0)
const lastDeploy = ref('')

onMounted(async () => {
  try {
    // 获取服务器数量
    const serverRes = await getServers()
    serverCount.value = serverRes.data.length

    // 获取部署统计
    const logRes = await getLogs({
      type: ['backend_deploy', 'frontend_deploy'],
      limit: 10,
    })

    // 计算成功部署数量
    successCount.value = logRes.data.filter(
      (log) => log.status === 'success'
    ).length

    // 获取最近部署时间
    if (logRes.data.length > 0) {
      const latestLog = logRes.data[0]
      lastDeploy.value = new Date(latestLog.createdAt).toLocaleString()
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
})
</script>

<style scoped>
.home-container {
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-content {
  text-align: center;
  padding: 40px 20px;
}

.welcome-content h1 {
  font-size: 28px;
  margin-bottom: 16px;
  color: #1f2329;
}

.description {
  font-size: 16px;
  color: #6b7280;
  max-width: 800px;
  margin: 0 auto 30px;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  font-size: 32px;
  margin-right: 16px;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1f2329;
}
</style>
