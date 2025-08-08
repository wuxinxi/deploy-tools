<template>
  <div class="server-manager-container">
    <el-card>
      <div class="card-header">
        <h2>服务器管理</h2>
        <el-button type="primary" icon="Plus" @click="openServerForm()">
        <el-button type="primary" icon="Plus" @click="openServerForm()">
          添加服务器
        </el-button>
      </div>

      <el-table :data="servers" border style="width: 100%">
        <el-table-column prop="name" label="服务器名称"></el-table-column>
        <el-table-column prop="ip" label="IP地址"></el-table-column>
        <el-table-column prop="port" label="SSH端口" width="90"></el-table-column>
        <el-table-column prop="username" label="用户名"></el-table-column>
        <el-table-column label="SSH连接">
          <template #default="scope">
            <el-tag :type="scope.row.sshStatus === 'success'
              ? 'success'
              : scope.row.sshStatus === 'failed'
                ? 'danger'
                : 'warning'
              ">
              {{
                scope.row.sshStatus === 'success'
                  ? 'SSH正常'
                  : scope.row.sshStatus === 'failed'
                    ? 'SSH失败'
                    : '未测试'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Java状态">
          <template #default="scope">
            <el-tag :type="scope.row.javaStatus === 'success'
              ? 'success'
              : scope.row.javaStatus === 'failed'
                ? 'danger'
                : 'warning'
              ">
              {{
                scope.row.javaStatus === 'success'
                  ? 'Java正常'
                  : scope.row.javaStatus === 'failed'
                    ? 'Java失败'
                    : '未测试'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Nginx状态">
      <el-table :data="servers" border style="width: 100%">
        <el-table-column prop="name" label="服务器名称"></el-table-column>
        <el-table-column prop="ip" label="IP地址"></el-table-column>
        <el-table-column prop="port" label="SSH端口" width="90"></el-table-column>
        <el-table-column prop="username" label="用户名"></el-table-column>
        <el-table-column label="SSH连接">
          <template #default="scope">
            <el-tag :type="scope.row.sshStatus === 'success'
              ? 'success'
              : scope.row.sshStatus === 'failed'
                ? 'danger'
                : 'warning'
              ">
              {{
                scope.row.sshStatus === 'success'
                  ? 'SSH正常'
                  : scope.row.sshStatus === 'failed'
                    ? 'SSH失败'
                    : '未测试'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Java状态">
          <template #default="scope">
            <el-tag :type="scope.row.javaStatus === 'success'
              ? 'success'
              : scope.row.javaStatus === 'failed'
                ? 'danger'
                : 'warning'
              ">
              {{
                scope.row.javaStatus === 'success'
                  ? 'Java正常'
                  : scope.row.javaStatus === 'failed'
                    ? 'Java失败'
                    : '未测试'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Nginx状态">
          <template #default="scope">
            <el-tag :type="scope.row.nginxStatus === 'success'
              ? 'success'
              : scope.row.nginxStatus === 'failed'
                ? 'danger'
                : 'warning'
              ">
            <el-tag :type="scope.row.nginxStatus === 'success'
              ? 'success'
              : scope.row.nginxStatus === 'failed'
                ? 'danger'
                : 'warning'
              ">
              {{
                scope.row.nginxStatus === 'success'
                  ? 'Nginx正常'
                  : scope.row.nginxStatus === 'failed'
                    ? 'Nginx失败'
                    : '未测试'
                scope.row.nginxStatus === 'success'
                  ? 'Nginx正常'
                  : scope.row.nginxStatus === 'failed'
                    ? 'Nginx失败'
                    : '未测试'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
        </el-table-column>
        <el-table-column label="操作" width="460">
        <el-table-column prop="createdAt" label="创建时间" width="180">
        </el-table-column>
        <el-table-column label="操作" width="460">
          <template #default="scope">
            <el-button size="small" type="text" @click="testSSH(scope.row.id)"
              :loading="testingSSH.includes(scope.row.id)">
              测试SSH
            </el-button>
            <el-button size="small" type="text" @click="testJava(scope.row.id)"
              :loading="testingJava.includes(scope.row.id)" :disabled="!scope.row.javaPath">
              测试Java
            </el-button>
            <el-button size="small" type="text" @click="testNginx(scope.row.id)"
              :loading="testingNginx.includes(scope.row.id)" :disabled="!scope.row.nginxPath">
              测试Nginx
            <el-button size="small" type="text" @click="testSSH(scope.row.id)"
              :loading="testingSSH.includes(scope.row.id)">
              测试SSH
            </el-button>
            <el-button size="small" type="text" @click="testJava(scope.row.id)"
              :loading="testingJava.includes(scope.row.id)" :disabled="!scope.row.javaPath">
              测试Java
            </el-button>
            <el-button size="small" type="text" @click="testNginx(scope.row.id)"
              :loading="testingNginx.includes(scope.row.id)" :disabled="!scope.row.nginxPath">
              测试Nginx
            </el-button>
            <el-button size="small" type="text" @click="openServerForm(scope.row)">
            <el-button size="small" type="text" @click="openServerForm(scope.row)">
              编辑
            </el-button>
            <el-button size="small" type="text" text-color="#ff4d4f" @click="handleDeleteServer(scope.row.id)">
            <el-button size="small" type="text" text-color="#ff4d4f" @click="handleDeleteServer(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange"
        :current-page="pagination.page" :page-sizes="[10, 20, 50]" :page-size="pagination.limit"
        layout="total, sizes, prev, pager, next, jumper" :total="pagination.total"
        style="margin-top: 15px; text-align: right"></el-pagination>
      <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange"
        :current-page="pagination.page" :page-sizes="[10, 20, 50]" :page-size="pagination.limit"
        layout="total, sizes, prev, pager, next, jumper" :total="pagination.total"
        style="margin-top: 15px; text-align: right"></el-pagination>
    </el-card>

    <!-- 服务器表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formTitle" width="600px" align-center class="server-form-dialog">
      <el-form :model="serverForm" ref="serverFormRef" :rules="formRules" label-width="100px" style="margin-top: 20px">
        <el-form-item label="服务器名称" prop="name">
          <el-input v-model="serverForm.name" placeholder="请输入服务器名称"></el-input>
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="serverForm.ip" placeholder="请输入服务器IP地址"></el-input>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="serverForm.ip" placeholder="请输入服务器IP地址"></el-input>
        </el-form-item>
        <el-form-item label="SSH端口" prop="port">
          <el-input v-model="serverForm.port" type="number" placeholder="请输入SSH端口，默认22"></el-input>
        <el-form-item label="SSH端口" prop="port">
          <el-input v-model="serverForm.port" type="number" placeholder="请输入SSH端口，默认22"></el-input>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="serverForm.username" placeholder="请输入登录用户名"></el-input>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="serverForm.username" placeholder="请输入登录用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码/密钥" prop="password">
          <el-input v-model="serverForm.password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码或私钥">
        <el-form-item label="密码/密钥" prop="password">
          <el-input v-model="serverForm.password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码或私钥">
            <template #suffix>
              <el-icon @click="showPassword = !showPassword">
                <Hide v-if="showPassword" />
                <View v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="Java路径">
          <el-input v-model="serverForm.javaPath" placeholder="例如: /usr/bin/java"></el-input>
          <div class="form-hint">Java可执行文件的全路径</div>
        </el-form-item>

        <el-form-item label="Nginx路径">
          <el-input v-model="serverForm.nginxPath" placeholder="例如: /usr/sbin/nginx"></el-input>
          <div class="form-hint">Nginx可执行文件的全路径</div>
        </el-form-item>

        <el-form-item label="部署路径">
          <el-input v-model="serverForm.deployPath" placeholder="例如: /opt/apps"></el-input>
          <div class="form-hint">应用部署的目标路径</div>
        </el-form-item>

        <el-form-item label="重启脚本">
          <el-input v-model="serverForm.restartScript" placeholder="例如: /opt/scripts/restart.sh"></el-input>
          <div class="form-hint">应用重启脚本的完整路径</div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="serverForm.remark" placeholder="请输入备注信息" type="textarea" rows="3"></el-input>
          <el-input v-model="serverForm.remark" placeholder="请输入备注信息" type="textarea" rows="3"></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitServerForm" :loading="formLoading">
        <el-button type="primary" @click="submitServerForm" :loading="formLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Hide, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  addServer,
  deleteServer,
  getServers,
  testSSHConnection,
  testJavaPath,
  testNginxPath,
  testSSHConnection,
  testJavaPath,
  testNginxPath,
  updateServer,
} from '../api/server'

// 状态变量
const servers = ref([])
const loading = ref(false)
const formLoading = ref(false)
const dialogVisible = ref(false)
const showPassword = ref(false)
const testingSSH = ref([])
const testingJava = ref([])
const testingNginx = ref([])
const testingSSH = ref([])
const testingJava = ref([])
const testingNginx = ref([])
const serverFormRef = ref(null)

// 分页信息
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
})

// 服务器表单数据
const serverForm = reactive({
  id: '',
  name: '',
  ip: '',
  port: 22,
  username: '',
  password: '',
  javaPath: '',
  nginxPath: '',
  deployPath: '',
  restartScript: '',
  remark: '',
})

// 表单验证规则
const formRules = reactive({
  name: [
    { required: true, message: '请输入服务器名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在1到50个字符', trigger: 'blur' },
  ],
  ip: [
    { required: true, message: '请输入服务器IP地址', trigger: 'blur' },
    {
      pattern: /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,
      message: '请输入有效的IP地址',
      trigger: 'blur',
    },
  ],
  port: [
    { required: true, message: '请输入SSH端口', trigger: 'blur' },
    {
      type: 'number',
      min: 1,
      max: 65535,
      message: '端口号必须在1-65535之间',
      trigger: 'blur',
    },
  ],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码或密钥', trigger: 'blur' }],
})

// 表单标题（根据新增/编辑状态动态变化）
const formTitle = computed(() => {
  return serverForm.id ? '编辑服务器' : '添加服务器'
})

// 获取服务器列表
const fetchServers = async () => {
  try {
    loading.value = true
    const res = await getServers({
      page: pagination.value.page,
      limit: pagination.value.limit,
    })

    if (res.success) {
      servers.value = res.data.map((server) => ({
        ...server,
        sshStatus: server.sshStatus || 'untested',
        javaStatus: server.javaStatus || 'untested',
        nginxStatus: server.nginxStatus || 'untested'
        sshStatus: server.sshStatus || 'untested',
        javaStatus: server.javaStatus || 'untested',
        nginxStatus: server.nginxStatus || 'untested'
      }))
      pagination.value.total = res.pagination.total
    }
  } catch (err) {
    console.error('获取服务器列表失败:', err)
    ElMessage.error('获取服务器列表失败: ' + (err.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 打开服务器表单
const openServerForm = (server = null) => {
  // 重置表单
  if (serverFormRef.value) {
    serverFormRef.value.resetFields()
  }

  // 如果是编辑，填充表单数据
  if (server) {
    Object.assign(serverForm, {
      id: server.id,
      name: server.name,
      ip: server.ip,
      port: server.port,
      username: server.username,
      password: server.password,
      javaPath: server.javaPath || '',
      nginxPath: server.nginxPath || '',
      deployPath: server.deployPath || '',
      restartScript: server.restartScript || '',
      remark: server.remark || '',
    })
  } else {
    // 新增时清空表单
    Object.assign(serverForm, {
      id: '',
      name: '',
      ip: '',
      port: 22,
      username: '',
      password: '',
      javaPath: '',
      nginxPath: '',
      deployPath: '',
      restartScript: '',
      remark: '',
    })
  }

  dialogVisible.value = true
  showPassword.value = false
}

// 提交服务器表单
const submitServerForm = async () => {
  try {
    // 表单验证
    await serverFormRef.value.validate()

    formLoading.value = true

    if (serverForm.id) {
      // 编辑服务器
      const res = await updateServer(serverForm.id, serverForm)
      if (res.success) {
        ElMessage.success('服务器更新成功')
      }
    } else {
      // 添加服务器
      const res = await addServer(serverForm)
      if (res.success) {
        ElMessage.success('服务器添加成功')
      }
    }

    dialogVisible.value = false
    fetchServers() // 重新获取服务器列表
  } catch (err) {
    if (err.name === 'ValidationError') return // 表单验证失败
    console.error('提交服务器表单失败:', err)
    ElMessage.error('操作失败: ' + (err.message || '未知错误'))
  } finally {
    formLoading.value = false
  }
}

// 测试SSH连接
const testSSH = async (serverId) => {
// 测试SSH连接
const testSSH = async (serverId) => {
  try {
    testingSSH.value.push(serverId);
    const res = await testSSHConnection(serverId);

    if (res.success) {
      const serverIndex = servers.value.findIndex((s) => s.id === serverId);
      if (serverIndex !== -1) {
        servers.value[serverIndex].sshStatus = 'success';
      }
      ElMessage.success('SSH连接测试成功');
    }
  } catch (err) {
    console.error('测试SSH连接失败:', err);
    const serverIndex = servers.value.findIndex((s) => s.id === serverId);
    if (serverIndex !== -1) {
      servers.value[serverIndex].sshStatus = 'failed';
    }
    ElMessage.error('SSH连接测试失败: ' + (err.message || '未知错误'));
  } finally {
    testingSSH.value = testingSSH.value.filter((id) => id !== serverId);
  }
};

// 测试Java路径
const testJava = async (serverId) => {
  try {
    testingJava.value.push(serverId);

    const res = await testJavaPath(serverId);

    testingSSH.value.push(serverId);
    const res = await testSSHConnection(serverId);

    if (res.success) {
      const serverIndex = servers.value.findIndex((s) => s.id === serverId);
      if (serverIndex !== -1) {
        servers.value[serverIndex].sshStatus = 'success';
      }
      ElMessage.success('SSH连接测试成功');
    }
  } catch (err) {
    console.error('测试SSH连接失败:', err);
    const serverIndex = servers.value.findIndex((s) => s.id === serverId);
    if (serverIndex !== -1) {
      servers.value[serverIndex].sshStatus = 'failed';
    }
    ElMessage.error('SSH连接测试失败: ' + (err.message || '未知错误'));
  } finally {
    testingSSH.value = testingSSH.value.filter((id) => id !== serverId);
  }
};

// 测试Java路径
const testJava = async (serverId) => {
  try {
    testingJava.value.push(serverId);

    const res = await testJavaPath(serverId);

    if (res.success) {
      const serverIndex = servers.value.findIndex((s) => s.id === serverId);
      const serverIndex = servers.value.findIndex((s) => s.id === serverId);
      if (serverIndex !== -1) {
        servers.value[serverIndex].javaStatus = res.valid ? 'success' : 'failed';
        servers.value[serverIndex].javaStatus = res.valid ? 'success' : 'failed';
      }
      ElMessage.success(res.valid ? 'Java路径测试成功' : 'Java路径测试失败');
      ElMessage.success(res.valid ? 'Java路径测试成功' : 'Java路径测试失败');
    }
  } catch (err) {
    const serverIndex = servers.value.findIndex((s) => s.id === serverId);
    if (serverIndex !== -1) {
      servers.value[serverIndex].javaStatus = 'failed';
    }
    ElMessage.error('Java路径测试失败: ' + (err.message || '未知错误'));
    const serverIndex = servers.value.findIndex((s) => s.id === serverId);
    if (serverIndex !== -1) {
      servers.value[serverIndex].javaStatus = 'failed';
    }
    ElMessage.error('Java路径测试失败: ' + (err.message || '未知错误'));
  } finally {
    testingJava.value = testingJava.value.filter((id) => id !== serverId);
  }
};

// 测试Nginx路径
const testNginx = async (serverId) => {
  try {
    testingNginx.value.push(serverId);
    const res = await testNginxPath(serverId);

    if (res.success) {
      const serverIndex = servers.value.findIndex((s) => s.id === serverId);
      if (serverIndex !== -1) {
        servers.value[serverIndex].nginxStatus = res.valid ? 'success' : 'failed';
      }
      ElMessage.success(res.valid ? 'Nginx路径测试成功' : 'Nginx路径测试失败');
    }
  } catch (err) {
    console.error('测试Nginx路径失败:', err);
    const serverIndex = servers.value.findIndex((s) => s.id === serverId);
    if (serverIndex !== -1) {
      servers.value[serverIndex].nginxStatus = 'failed';
    }
    ElMessage.error('Nginx路径测试失败: ' + (err.message || '未知错误'));
  } finally {
    testingNginx.value = testingNginx.value.filter((id) => id !== serverId);
    testingJava.value = testingJava.value.filter((id) => id !== serverId);
  }
};

// 测试Nginx路径
const testNginx = async (serverId) => {
  try {
    testingNginx.value.push(serverId);
    const res = await testNginxPath(serverId);

    if (res.success) {
      const serverIndex = servers.value.findIndex((s) => s.id === serverId);
      if (serverIndex !== -1) {
        servers.value[serverIndex].nginxStatus = res.valid ? 'success' : 'failed';
      }
      ElMessage.success(res.valid ? 'Nginx路径测试成功' : 'Nginx路径测试失败');
    }
  } catch (err) {
    console.error('测试Nginx路径失败:', err);
    const serverIndex = servers.value.findIndex((s) => s.id === serverId);
    if (serverIndex !== -1) {
      servers.value[serverIndex].nginxStatus = 'failed';
    }
    ElMessage.error('Nginx路径测试失败: ' + (err.message || '未知错误'));
  } finally {
    testingNginx.value = testingNginx.value.filter((id) => id !== serverId);
  }
};
};

// 删除服务器
const handleDeleteServer = async (serverId) => {
  try {
    await ElMessageBox.confirm('确定要删除这台服务器吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res = await deleteServer(serverId)
    if (res.success) {
      ElMessage.success('服务器删除成功')
      fetchServers() // 重新获取服务器列表
    }
  } catch (err) {
    if (err === 'cancel') return // 用户取消操作
    console.error('删除服务器失败:', err)
    ElMessage.error('删除失败: ' + (err.message || '未知错误'))
  }
}

// 分页事件处理
const handleSizeChange = (val) => {
  pagination.value.limit = val
  pagination.value.page = 1
  fetchServers()
}

const handleCurrentChange = (val) => {
  pagination.value.page = val
  fetchServers()
}

// 页面加载时获取数据
onMounted(() => {
  fetchServers()
})
</script>

<style scoped>
.server-manager-container {
  padding: 20px;
}

.server-form-dialog {
  display: flex;
  align-items: center;
  justify-content: center;
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

.form-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}

.form-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}
</style>
