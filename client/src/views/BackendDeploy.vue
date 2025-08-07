<template>
  <div class="backend-deploy-container">
    <el-card>
      <div class="card-header">
        <h2>后端应用部署</h2>
        <p>上传Spring Boot JAR包并部署到指定服务器</p>
      </div>
      
      <el-form 
        :model="deployForm" 
        ref="deployFormRef"
        :rules="formRules"
        label-width="120px"
        style="margin-top: 20px;"
      >
        <el-form-item label="目标服务器" prop="serverId">
          <el-select 
            v-model="deployForm.serverId" 
            placeholder="请选择服务器"
            clearable
            style="width: 100%;"
          >
            <el-option 
              v-for="server in servers" 
              :key="server.id"
              :label="`${server.name} (${server.ip}:${server.port})`"
              :value="server.id"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="JAR文件" prop="jarFile">
          <el-upload
            ref="upload"
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="true"
            accept=".jar"
            :file-list="fileList"
            class="upload-demo"
          >
            <el-button type="primary">选择JAR文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传JAR文件，最大不超过100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="服务器文件名" prop="serverFileName">
          <el-input 
            v-model="deployForm.serverFileName" 
            placeholder="服务器上的文件名"
          ></el-input>
          <div class="form-hint">
            如果服务器上已存在同名文件，将自动备份为 .bak.当前日期 格式
          </div>
        </el-form-item>
        
        <el-form-item label="部署路径" prop="targetPath">
          <el-input 
            v-model="deployForm.targetPath" 
            placeholder="例如: /opt/apps"
          ></el-input>
          <div class="form-hint">请确保路径存在且有写入权限</div>
        </el-form-item>
        
        <el-form-item label="重启脚本" prop="restartScript">
          <el-input 
            v-model="deployForm.restartScript" 
            placeholder="例如: /opt/scripts/restart.sh"
          ></el-input>
          <div class="form-hint">
            脚本应负责停止旧服务、启动新服务等操作
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="submitDeploy"
            :loading="deploying"
          >
            开始部署
          </el-button>
          <el-button 
            @click="resetForm"
            style="margin-left: 10px;"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 部署日志 -->
      <div v-if="deploying || deployLog" class="deploy-log">
        <h3>部署日志</h3>
        <pre class="log-content">{{ deployLog }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { deployBackendApi } from '../api/deploy'
import { getLogDetail } from '../api/log'
import { getServers } from '../api/server'

// 状态变量
const servers = ref([])
const loading = ref(false)
const deploying = ref(false)
const deployLog = ref('')
const logId = ref(null)
const fileList = ref([])
const deployFormRef = ref(null)

// 部署表单数据
const deployForm = reactive({
  serverId: '',
  jarFile: null,
  targetPath: '',
  restartScript: '',
  serverFileName: '' // 新增服务器文件名
})

// 表单验证规则
const formRules = reactive({
  serverId: [
    { required: true, message: '请选择目标服务器', trigger: 'change' }
  ],
  jarFile: [
    { required: true, message: '请选择JAR文件', trigger: 'change' }
  ],
  targetPath: [
    { required: true, message: '请输入部署路径', trigger: 'blur' },
    { pattern: /^\/.*/, message: '请输入绝对路径', trigger: 'blur' }
  ],
  restartScript: [
    { required: true, message: '请输入重启脚本路径', trigger: 'blur' },
    { pattern: /^\/.*/, message: '请输入绝对路径', trigger: 'blur' }
  ],
  serverFileName: [ // 新增服务器文件名验证规则
    { required: true, message: '请输入服务器文件名', trigger: 'blur' }
  ]
})

// 获取服务器列表
const fetchServers = async () => {
  try {
    loading.value = true
    const res = await getServers({
      limit: 100
    })
    
    if (res.success) {
      servers.value = res.data
    }
  } catch (err) {
    console.error('获取服务器列表失败:', err)
    ElMessage.error('获取服务器列表失败: ' + (err.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 处理文件选择
const handleFileChange = (file, fileList) => {
  // 只保留最后选择的一个文件
  if (fileList.length > 1) {
    fileList.splice(0, fileList.length - 1)
  }
  deployForm.jarFile = file.raw
  
  // 自动设置服务器文件名为当前文件名
  if (file.raw && file.raw.name) {
    deployForm.serverFileName = file.raw.name
  }
}

// 提交部署
const submitDeploy = async () => {
  try {
    // 表单验证
    await deployFormRef.value.validate()
    
    // 确认部署
    await ElMessageBox.confirm(
      `确定要将应用部署到所选服务器吗？\n服务器: ${getServerName(deployForm.serverId)}\n文件名: ${deployForm.serverFileName}\n路径: ${deployForm.targetPath}\n脚本: ${deployForm.restartScript}`,
      '确认部署',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 创建FormData
    const formData = new FormData()
    formData.append('serverId', deployForm.serverId)
    formData.append('targetPath', deployForm.targetPath)
    formData.append('restartScript', deployForm.restartScript)
    formData.append('jarFile', deployForm.jarFile)
    formData.append('serverFileName', deployForm.serverFileName) // 添加服务器文件名
    
    // 开始部署
    deploying.value = true
    deployLog.value = '开始部署...\n'
    
    const res = await deployBackendApi(formData)
    if (res.success) {
      deployLog.value += '部署请求已提交，正在执行部署操作...\n'
      logId.value = res.logId
      
      // 开始轮询获取日志
      startLogPolling()
    }
  } catch (err) {
    if (err === 'cancel') return // 用户取消操作
    if (err.name === 'ValidationError') return // 表单验证失败
    
    console.error('部署失败:', err)
    ElMessage.error('部署失败: ' + (err.message || '未知错误'))
    
    // 停止部署状态
    deploying.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (deployFormRef.value) {
    deployFormRef.value.resetFields()
  }
  fileList.value = []
  deployForm.jarFile = null
  deployForm.serverFileName = '' // 重置服务器文件名
  deployLog.value = ''
  logId.value = null
}

// 获取服务器名称
const getServerName = (serverId) => {
  const server = servers.value.find(s => s.id === serverId)
  return server ? server.name : '未知服务器'
}

// 日志轮询
const startLogPolling = () => {
  if (!logId.value) return
  
  const interval = setInterval(async () => {
    try {
      const res = await getLogDetail(logId.value)
      if (res.success) {
        deployLog.value = res.data.message
        
        // 如果部署完成，停止轮询
        if (res.data.status !== 'pending') {
          clearInterval(interval)
          deploying.value = false
          
          if (res.data.status === 'success') {
            ElMessage.success('后端部署成功')
          } else {
            ElMessage.error('后端部署失败')
          }
        }
      }
    } catch (err) {
      clearInterval(interval)
      deploying.value = false
      console.error('获取部署日志失败:', err)
      ElMessage.error('获取部署日志失败: ' + (err.message || '未知错误'))
    }
  }, 2000) // 每2秒查询一次
}

// 页面加载时获取服务器列表
onMounted(() => {
  fetchServers()
})
</script>

<style scoped>
.backend-deploy-container {
  padding: 20px;
}

.card-header {
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.card-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.form-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}

.deploy-log {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.deploy-log h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
}

.log-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 14px;
  max-height: 400px;
  overflow-y: auto;
}
</style>
