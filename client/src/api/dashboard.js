import request from './axios';

/**
 * 获取仪表盘统计数据
 * @returns {Promise}
 */
export const getDashboardStats = () => {
  return request.get('/dashboard/stats');
};

/**
 * 获取最近部署记录
 * @param {number} limit - 记录数量限制，默认10
 * @returns {Promise}
 */
export const getRecentDeployments = (limit = 10) => {
  return request.get('/dashboard/recent-deployments', { 
    params: { limit } 
  });
};
