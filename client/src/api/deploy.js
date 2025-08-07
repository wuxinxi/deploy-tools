import axios from './axios'

// 部署后端应用
export const deployBackend = (formData) => {
  return axios.post('/deploy/backend', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      // 可以在这里处理上传进度
      return progressEvent
    }
  })
}

// 部署前端应用
export const deployFrontend = (formData) => {
  return axios.post('/deploy/frontend', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      // 可以在这里处理上传进度
      return progressEvent
    }
  })
}
