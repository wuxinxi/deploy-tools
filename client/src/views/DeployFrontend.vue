<template>
  <div class="deploy-container">
    <el-card>
      <h2>前端应用部署</h2>
      
      <el-form 
        :model="deployForm" 
        ref="deployFormRef"
        :rules="deployRules"
        label-width="150px"
        style="margin-top: 20px"
      >
        <el-form-item label="目标服务器" prop="serverId">
          <el-select 
            v-model="deployForm.serverId" 
            placeholder="请选择服务器"
            clearable
          >
            <el-option 
              v-for="server in servers" 
              :key="server.id"
              :label="`${server.name} (${server.host}:${server.port})`"
              :value="server.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="ZIP文件" prop="distFile">
          <el-upload
            ref="upload"
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="true"
            :file-list="fileList"
            accept=".zip"
            class="upload-demo"
          >
            <el-button type="primary">选择ZIP文件</el-button>
            <template #tip>
              <div class="el-upload__tip text-sm text-gray-500">
                请将dist目录压缩为ZIP格式，最大支持 50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="服务器目标路径" prop="targetPath">
          <el-input 
            v-model="deployForm.targetPath" 
            placeholder="例如: /usr/share/nginx/html/" 
          />
          <div class="el-form-item__help">
            服务器上存放前端文件的目录路径，通常是Nginx的html目录
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="deployForm.reloadNginx" checked>
            部署完成后自动执行 nginx -s reload
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-progress 
            v-if="uploadProgress > 0 && uploadProgress < 100"
            :percentage="uploadProgress" 
            stroke-width="4"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleDeploy"
            :loading="isDeploying"
          >
            开始部署
          </el-button>
          <el-button 
            @click="resetForm"
            style="margin-left: 10px"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 部署日志 -->
    <el-card style="margin-top: 20px" v-if="showLog">
      <h3>部署日志</h3>
      <el-scrollbar height="300px" class="log-scrollbar">
        <pre class="log-content">{{ deployLog }}</pre>
      </el-scrollbar>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { getServers } from '../api/server'
import { deployFrontend } from '../api/deploy'
import { getLogDetail } from '../api/log'

// 服务器列表
const servers = ref([])
const loadingServers = ref(false)

// 部署表单
const deployForm = reactive({
  serverId: '',
  targetPath: '',
  reloadNginx: true,
  distFile: null
})

// 表单规则
const deployRules = {
  serverId: [
    { required: true, message: '请选择目标服务器', trigger: 'change' }
  ],
  distFile: [
    { required: true, message: '请选择ZIP文件', trigger: 'change' }
  ],
  targetPath: [
    { required: true, message: '请输入服务器目标路径', trigger: 'blur' },
    { pattern: /^\/.*/, message: '路径必须以/开头', trigger: 'blur' }
  ]
}

// 上传相关
const fileList = ref([])
const uploadProgress = ref(0)
const isDeploying = ref(false)
const deployFormRef = ref(null)
const upload = ref(null)

// 日志相关
const showLog = ref(false)
const deployLog = ref('')
const currentLogId = ref(null)
const logInterval = ref(null)

// 获取服务器列表
const fetchServers = async () => {
  try {
    loadingServers.value = true
    const res = await getServers()
    servers.value = res.data
  } catch (error) {
    console.error('获取服务器列表失败:', error)
    ElMessage.error('获取服务器列表失败')
  } finally {
    loadingServers.value = false
  }
}

// 处理文件选择
const handleFileChange = (file, fileList) => {
  // 只保留最后一个选择的文件
  if (fileList.length > 1) {
    fileList.splice(0, fileList.length - 1)
  }
  deployForm.distFile = file.raw
}

// 处理部署
const handleDeploy = async () => {
  try {
    // 表单验证
    await deployFormRef.value.validate()
    
    // 创建FormData
    const formData = new FormData()
    formData.append('serverId', deployForm.serverId)
    formData.append('targetPath', deployForm.targetPath)
    formData.append('reloadNginx', deployForm.reloadNginx)
    formData.append('distFile', deployForm.distFile)
    
    // 重置进度和日志
    uploadProgress.value = 0
    deployLog.value = '开始部署流程...\n'
    showLog.value = true
    isDeploying.value = true
    
    // 执行部署
    const res = await deployFrontend(formData)
    currentLogId.value = res.logId
    
    // 部署成功通知
    ElNotification({
      title: '成功',
      message: '部署任务已提交，正在执行中',
      type: 'success',
      duration: 3000
    })
    
    // 开始轮询日志
    startLogPolling()
  } catch (error) {
    console.error('部署失败:', error)
    ElMessage.error('部署失败: ' + (error.message || '未知错误'))
    isDeploying.value = false
  }
}

// 开始轮询日志
const startLogPolling = () => {
  // 清除之前的定时器
  if (logInterval.value) {
    clearInterval(logInterval.value)
  }
  
  // 立即获取一次日志
  fetchLogDetail()
  
  // 设置定时器，每3秒获取一次日志
  logInterval.value = setInterval(() => {
    fetchLogDetail()
  }, 3000)
}

// 获取日志详情
const fetchLogDetail = async () => {
  if (!currentLogId.value) return
  
  try {
    const res = await getLogDetail(currentLogId.value)
    const logData = res.data
    
    // 更新日志内容
    deployLog.value = logData.message || ''
    uploadProgress.value = calculateProgress(logData.message)
    
    // 如果部署完成，停止轮询
    if (logData.status !== 'pending') {
      clearInterval(logInterval.value)
      isDeploying.value = false
      
      if (logData.status === 'success') {
        ElNotification({
          title: '成功',
          message: '前端应用部署完成',
          type: 'success',
          duration: 3000
        })
        uploadProgress.value = 100
      } else if (logData.status === 'error') {
        ElNotification({
          title: '失败',
          message: '前端应用部署失败',
          type: 'error',
          duration: 3000
        })
      }
    }
  } catch (error) {
    console.error('获取日志失败:', error)
  }
}

// 根据日志内容计算进度
const calculateProgress = (message) => {
  if (!message) return 0
  
  if (message.includes('部署完成')) return 100
  if (message.includes('nginx 重新加载完成')) return 90
  if (message.includes('开始执行 nginx -s reload')) return 80
  if (message.includes('文件解压完成')) return 70
  if (message.includes('开始解压文件')) return 50
  if (message.includes('文件上传完成')) return 30
  if (message.includes('开始上传文件')) return 10
  
  return uploadProgress.value
}

// 重置表单
const resetForm = () => {
  deployFormRef.value.resetFields()
  fileList.value = []
  deployForm.distFile = null
  uploadProgress.value = 0
  showLog.value = false
  deployLog.value = ''
  
  // 清除日志轮询
  if (logInterval.value) {
    clearInterval(logInterval.value)
    logInterval.value = null
  }
}

// 组件卸载时清除定时器
watch(
  () => false,
  () => {
    if (logInterval.value) {
      clearInterval(logInterval.value)
    }
  }
)

// 初始化
onMounted(() => {
  fetchServers()
})
</script>

<style scoped>
.deploy-container {
  padding: 20px;
}

.log-scrollbar {
  margin-top: 10px;
}

.log-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>
