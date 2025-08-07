import request from './axios';

/**
 * 部署后端应用
 * @param {FormData} formData - 包含部署信息的FormData对象
 * @returns {Promise}
 */
export const deployBackendApi = (formData) => {
  return request.post('/deploy/backend', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 部署前端应用
 * @param {FormData} formData - 包含部署信息的FormData对象
 * @returns {Promise}
 */
export const deployFrontendApi = (formData) => {
  return request.post('/deploy/frontend', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
