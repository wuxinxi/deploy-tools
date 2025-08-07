import request from './axios';

/**
 * 获取日志列表
 * @param {Object} params - 包含筛选和分页参数的对象
 * @returns {Promise}
 */
export const getLogs = (params) => {
  return request.get('/logs', { params });
};

/**
 * 获取单个日志详情
 * @param {string} id - 日志ID
 * @returns {Promise}
 */
export const getLogDetail = (id) => {
  return request.get(`/logs/${id}`);
};

/**
 * 删除单个日志
 * @param {string} id - 日志ID
 * @returns {Promise}
 */
export const deleteLog = (id) => {
  return request.delete(`/logs/${id}`);
};

/**
 * 清空日志
 * @param {Object} params - 包含筛选条件的对象
 * @returns {Promise}
 */
export const clearLogs = (params) => {
  return request.delete('/logs', { params });
};
