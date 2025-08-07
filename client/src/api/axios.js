import axios from 'axios'
import { ElMessage } from 'element-plus'

const instance = axios.create({
  baseURL: '/api',
  timeout: 60000 // 1分钟超时
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证信息
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const res = response.data
    // 如果返回的是错误状态
    if (!res.success && res.message) {
      ElMessage.error(res.message)
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res
  },
  (error) => {
    let message = '请求失败'
    if (error.response) {
      switch (error.response.status) {
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 401:
          message = '请先登录'
          // 可以在这里跳转到登录页
          break
        default:
          message = error.response.data?.message || message
      }
    } else if (error.message.includes('timeout')) {
      message = '请求超时'
    }
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default instance
