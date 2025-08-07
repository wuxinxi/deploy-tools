import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 60000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证信息，如token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    // 请求错误处理
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 处理成功响应
    const res = response.data

    // 如果后端返回的是错误状态
    if (!res.success) {
      return Promise.reject(new Error(res.message || '操作失败'))
    }

    return res
  },
  (error) => {
    // 处理错误响应
    console.error('响应错误:', error)

    // 提取错误信息
    let errorMessage = '请求失败，请稍后重试'
    if (error.response) {
      // 服务器返回错误
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message
      } else {
        errorMessage = `请求失败 (${error.response.status})`
      }
    } else if (error.request) {
      // 请求已发出但无响应
      errorMessage = '服务器无响应，请检查连接'
    }

    return Promise.reject(new Error(errorMessage))
  }
)

export default service
