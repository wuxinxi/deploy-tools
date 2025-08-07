<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <div class="welcome-content">
        <h1>欢迎使用运维自动化部署工具</h1>
        <p>高效、安全地部署您的应用程序</p>

        <div class="stats-grid">
          <el-card class="stat-card">
            <div class="stat-icon">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ serverCount }}</div>
              <div class="stat-label">已管理服务器</div>
            </div>
          </el-card>

          <el-card class="stat-card">
            <div class="stat-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ deployCountToday }}</div>
              <div class="stat-label">今日部署次数</div>
            </div>
          </el-card>

          <el-card class="stat-card">
            <div class="stat-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ successRate }}%</div>
              <div class="stat-label">部署成功率</div>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>

    <div class="recent-activity">
      <el-card>
        <div class="card-header">
          <h2>最近部署活动</h2>
        </div>

        <el-table
          :data="recentDeployments"
          border
          style="width: 100%"
        >
          <el-table-column
            prop="time"
            label="时间"
            width="180"
          ></el-table-column>
          <el-table-column
            prop="serverName"
            label="服务器"
            width="180"
          ></el-table-column>
          <el-table-column
            prop="type"
            label="类型"
            width="100"
          >
            <template #default="scope">
              <el-tag
                :type="scope.row.type === 'backend' ? 'primary' : 'success'"
              >
                {{ scope.row.type === 'backend' ? '后端' : '前端' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            label="状态"
            width="100"
          >
            <template #default="scope">
              <el-tag
                :type="scope.row.status === 'success' ? 'success' : 'danger'"
              >
                {{ scope.row.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="message"
            label="详情"
          ></el-table-column>
          <el-table-column
            label="操作"
            width="100"
          >
            <template #default="scope">
              <el-button
                size="small"
                type="text"
                @click="viewDeploymentDetail(scope.row.id)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboardStats, getRecentDeployments } from '../api/dashboard'

// 状态变量
const serverCount = ref(0)
const deployCountToday = ref(0)
const successRate = ref(0)
const recentDeployments = ref([])
const loading = ref(true)

const router = useRouter()

// 获取仪表盘统计数据
const fetchDashboardStats = async () => {
  try {
    const res = await getDashboardStats()
    if (res.success) {
      serverCount.value = res.data.serverCount
      deployCountToday.value = res.data.deployCountToday
      successRate.value = res.data.successRate
    }
  } catch (err) {
    console.error('获取仪表盘统计数据失败:', err)
    ElMessage.error('获取统计数据失败: ' + (err.message || '未知错误'))
  }
}

// 获取最近部署记录
const fetchRecentDeployments = async () => {
  try {
    const res = await getRecentDeployments()
    if (res.success) {
      recentDeployments.value = res.data
    }
  } catch (err) {
    console.error('获取最近部署记录失败:', err)
    ElMessage.error('获取部署记录失败: ' + (err.message || '未知错误'))
  }
}

// 查看部署详情
const viewDeploymentDetail = (logId) => {
  router.push({ path: '/logs', query: { logId } })
}

// 页面加载时获取数据
onMounted(async () => {
  try {
    loading.value = true
    await Promise.all([fetchDashboardStats(), fetchRecentDeployments()])
  } finally {
    loading.value = false
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
  padding: 30px 0;
}

.welcome-content h1 {
  margin: 0 0 15px 0;
  font-size: 28px;
  font-weight: 600;
}

.welcome-content p {
  margin: 0 0 30px 0;
  font-size: 16px;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 0 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  font-size: 36px;
  margin-right: 20px;
  color: #409eff;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.card-header {
  margin-bottom: 15px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
</style>
