<template>
  <div class="logs-container">
    <el-card>
      <div class="card-header">
        <h2>部署日志</h2>
        <el-button type="danger" text @click="handleClearLogs" :disabled="loading">
          <el-icon>
            <Delete />
          </el-icon>
          清空日志
        </el-button>
      </div>

      <div class="filter-bar">
        <el-select v-model="filter.serverId" placeholder="选择服务器" clearable style="width: 200px; margin-right: 10px"
          @change="fetchLogs">
          <el-option v-for="server in servers" :key="server.id" :label="server.name" :value="server.id"></el-option>
        </el-select>

        <el-select v-model="filter.type" placeholder="日志类型" clearable style="width: 160px; margin-right: 10px"
          @change="fetchLogs">
          <el-option label="连接测试" value="connection_test"></el-option>
          <el-option label="后端部署" value="backend_deploy"></el-option>
          <el-option label="前端部署" value="frontend_deploy"></el-option>
        </el-select>

        <el-select v-model="filter.status" placeholder="状态" clearable style="width: 120px; margin-right: 10px"
          @change="fetchLogs">
          <el-option label="成功" value="success"></el-option>
          <el-option label="失败" value="error"></el-option>
          <el-option label="进行中" value="pending"></el-option>
        </el-select>

        <el-input v-model="filter.keyword" placeholder="搜索日志内容" style="width: 250px" clearable @keyup.enter="fetchLogs">
          <template #append>
            <el-button icon="Search" size="small" @click="fetchLogs"></el-button>
          </template>
        </el-input>
      </div>

      <el-table :data="logs" border style="width: 100%; margin-top: 15px" v-loading="loading">
        <el-table-column prop="id" label="ID"></el-table-column>
        <el-table-column prop="serverName" label="服务器"></el-table-column>
        <el-table-column prop="type" label="类型">
          <template #default="scope">
            <el-tag :type="typeTagType[scope.row.type]">
              {{ typeTextMap[scope.row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="statusTagType[scope.row.status]">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间"></el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" type="text" @click="viewLogDetail(scope.row.id)">
              查看详情
            </el-button>
            <el-button size="small" type="text" text-color="#ff4d4f" @click="handleDeleteLog(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange"
        :current-page="pagination.page" :page-sizes="[10, 20, 50]" :page-size="pagination.limit"
        layout="total, sizes, prev, pager, next, jumper" :total="pagination.total"
        style="margin-top: 15px; text-align: right"></el-pagination>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="800px" :before-close="handleDetailClose">
      <pre class="log-detail-content" v-if="currentLog">{{ currentLog.message }}</pre>
      <div v-else>加载中...</div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { clearLogs, deleteLog, getLogDetail, getLogs } from '../api/log'
import { getServers } from '../api/server'

// 状态变量
const logs = ref([])
const servers = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const currentLog = ref(null)

// 分页信息
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
})

// 过滤条件
const filter = reactive({
  serverId: '',
  type: '',
  status: '',
  keyword: '',
})

// 日志类型文本映射
const typeTextMap = {
  connection_test: '连接测试',
  backend_deploy: '后端部署',
  frontend_deploy: '前端部署',
}

// 日志类型标签样式映射
const typeTagType = {
  connection_test: 'info',
  backend_deploy: 'primary',
  frontend_deploy: 'success',
}

// 状态文本映射
const statusTextMap = {
  pending: '进行中',
  success: '成功',
  error: '失败',
}

// 状态标签样式映射
const statusTagType = {
  pending: 'warning',
  success: 'success',
  error: 'danger',
}

// 获取服务器列表（用于筛选）
const fetchServers = async () => {
  try {
    const res = await getServers({ limit: 100 })
    if (res.success) {
      servers.value = res.data
    }
  } catch (err) {
    console.error('获取服务器列表失败:', err)
    ElMessage.error('获取服务器列表失败: ' + (err.message || '未知错误'))
  }
}

// 获取日志列表
const fetchLogs = async () => {
  try {
    loading.value = true
    const res = await getLogs({
      ...filter,
      page: pagination.value.page,
      limit: pagination.value.limit,
    })

    if (res.success) {
      logs.value = res.data
      pagination.value.total = res.pagination.total
    }
  } catch (err) {
    console.error('获取日志列表失败:', err)
    ElMessage.error('获取日志列表失败: ' + (err.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 查看日志详情
const viewLogDetail = async (logId) => {
  try {
    loading.value = true
    const res = await getLogDetail(logId)

    if (res.success) {
      currentLog.value = res.data
      detailVisible.value = true
    }
  } catch (err) {
    console.error('获取日志详情失败:', err)
    ElMessage.error('获取日志详情失败: ' + (err.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 关闭详情对话框
const handleDetailClose = () => {
  currentLog.value = null
  detailVisible.value = false
}

// 删除单个日志
const handleDeleteLog = async (logId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条日志吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res = await deleteLog(logId)
    if (res.success) {
      ElMessage.success('日志删除成功')
      fetchLogs() // 重新获取日志列表
    }
  } catch (err) {
    if (err === 'cancel') return // 用户取消操作
    console.error('删除日志失败:', err)
    ElMessage.error('删除失败: ' + (err.message || '未知错误'))
  }
}

// 清空日志
const handleClearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有日志吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger',
      }
    )

    // 构建清空日志的过滤条件
    const clearFilter = {}
    if (filter.serverId) clearFilter.serverId = filter.serverId
    if (filter.type) clearFilter.type = filter.type

    const res = await clearLogs(clearFilter)
    if (res.success) {
      ElMessage.success('日志清空成功')
      fetchLogs() // 重新获取日志列表
    }
  } catch (err) {
    if (err === 'cancel') return // 用户取消操作
    console.error('清空日志失败:', err)
    ElMessage.error('清空失败: ' + (err.message || '未知错误'))
  }
}

// 分页事件处理
const handleSizeChange = (val) => {
  pagination.value.limit = val
  pagination.value.page = 1
  fetchLogs()
}

const handleCurrentChange = (val) => {
  pagination.value.page = val
  fetchLogs()
}

// 页面加载时获取数据
onMounted(() => {
  fetchServers()
  fetchLogs()
})
</script>

<style scoped>
.logs-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.log-detail-content {
  width: 100%;
  max-height: 500px;
  overflow-y: auto;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
