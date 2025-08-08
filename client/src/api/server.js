import request from './axios'

/**
 * 获取服务器列表
 * @param {Object} params - 包含分页参数的对象
 * @returns {Promise}
 */
export const getServers = (params) => {
  return request.get('/servers', { params })
}

/**
 * 获取单个服务器详情
 * @param {string} id - 服务器ID
 * @returns {Promise}
 */
export const getServerDetail = (id) => {
  return request.get(`/servers/${id}`)
}

/**
 * 添加服务器
 * @param {Object} data - 服务器信息
 * @returns {Promise}
 */
export const addServer = (data) => {
  return request.post('/servers', data)
}

/**
 * 更新服务器
 * @param {string} id - 服务器ID
 * @param {Object} data - 更新的服务器信息
 * @returns {Promise}
 */
export const updateServer = (id, data) => {
  return request.put(`/servers/${id}`, data)
}

/**
 * 删除服务器
 * @param {string} id - 服务器ID
 * @returns {Promise}
 */
export const deleteServer = (id) => {
  return request.delete(`/servers/${id}`)
}

/**
 * 测试SSH连接
 * @param {string} id - 服务器ID
 * @returns {Promise}
 */
export const testSSHConnection = (id) => {
  return request.post(`/servers/${id}/test-ssh`)
}

/**
 * 测试Java路径
 * @param {string} id - 服务器ID
 * @returns {Promise}
 */
export const testJavaPath = (id) => {
  return request.post(`/servers/${id}/test-java`)
}

/**
 * 测试Nginx路径
 * @param {string} id - 服务器ID
 * @returns {Promise}
 */
export const testNginxPath = (id) => {
  return request.post(`/servers/${id}/test-nginx`)
}
