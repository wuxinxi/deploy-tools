import axios from './axios'

// 获取日志列表
export const getLogs = (params) => {
  return axios.get('/logs', { params })
}

// 获取日志详情
export const getLogDetail = (id) => {
  return axios.get(`/logs/${id}`)
}

// 删除日志
export const deleteLog = (id) => {
  return axios.delete(`/logs/${id}`)
}

// 清空日志
export const clearLogs = (params) => {
  return axios.delete('/logs', { params })
}
