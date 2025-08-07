import axios from './axios'

// 获取服务器列表
export const getServers = (params) => {
  return axios.get('/servers', { params })
}

// 获取单个服务器
export const getServer = (id) => {
  return axios.get(`/servers/${id}`)
}

// 添加服务器
export const addServer = (data) => {
  return axios.post('/servers', data)
}

// 更新服务器
export const updateServer = (id, data) => {
  return axios.put(`/servers/${id}`, data)
}

// 删除服务器
export const deleteServer = (id) => {
  return axios.delete(`/servers/${id}`)
}

// 测试服务器连接
export const testServerConnection = (id) => {
  return axios.post('/servers/test-connection', { serverId: id })
}
