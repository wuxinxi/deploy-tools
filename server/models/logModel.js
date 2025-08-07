const db = require('../db/init');

class Log {
  /**
   * 获取日志列表
   * @param {Object} options - 查询选项
   * @returns {Promise}
   */
  static find({ page = 1, limit = 10, ...filter }) {
    return new Promise((resolve, reject) => {
      const offset = (page - 1) * limit;
      let query = `
        SELECT l.*, s.name as serverName 
        FROM logs l
        LEFT JOIN servers s ON l.serverId = s.id
      `;
      const params = [];
      
      // 构建过滤条件
      const filterKeys = Object.keys(filter);
      if (filterKeys.length > 0) {
        query += ' WHERE ';
        filterKeys.forEach((key, index) => {
          // 如果是关键字搜索，特殊处理
          if (key === 'keyword') {
            query += 'l.message LIKE ?';
            params.push(`%${filter[key]}%`);
          } else {
            query += `l.${key} = ?`;
            params.push(filter[key]);
          }
          
          if (index < filterKeys.length - 1) {
            query += ' AND ';
          }
        });
      }
      
      // 添加分页和排序
      query += ' ORDER BY l.createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 根据ID获取日志
   * @param {number} id - 日志ID
   * @returns {Promise}
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT l.*, s.name as serverName 
         FROM logs l
         LEFT JOIN servers s ON l.serverId = s.id
         WHERE l.id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  /**
   * 创建日志
   * @param {Object} logData - 日志数据
   * @returns {Promise}
   */
  static create(logData) {
    return new Promise((resolve, reject) => {
      const { type, serverId, message, status, completedAt } = logData;
      
      db.run(
        `INSERT INTO logs (type, serverId, message, status, completedAt) 
         VALUES (?, ?, ?, ?, ?)`,
        [type, serverId || null, message, status || 'pending', completedAt || null],
        function(err) {
          if (err) {
            reject(err);
          } else {
            // 返回创建的日志信息
            Log.findById(this.lastID).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  /**
   * 更新日志
   * @param {number} id - 日志ID
   * @param {Object} logData - 日志数据
   * @returns {Promise}
   */
  static update(id, logData) {
    return new Promise((resolve, reject) => {
      const { message, status, completedAt } = logData;
      const updates = [];
      const params = [];
      
      if (message !== undefined) {
        updates.push('message = ?');
        params.push(message);
      }
      
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }
      
      if (completedAt !== undefined) {
        updates.push('completedAt = ?');
        params.push(completedAt);
      }
      
      // 总是更新updatedAt
      updates.push('updatedAt = CURRENT_TIMESTAMP');
      
      if (updates.length === 1) {
        // 没有需要更新的字段
        return Log.findById(id).then(resolve).catch(reject);
      }
      
      db.run(
        `UPDATE logs 
         SET ${updates.join(', ')}
         WHERE id = ?`,
        [...params, id],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('日志不存在'));
          } else {
            // 返回更新后的日志信息
            Log.findById(id).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  /**
   * 删除日志
   * @param {number} id - 日志ID
   * @returns {Promise}
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM logs WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('日志不存在'));
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  /**
   * 清空日志
   * @param {Object} filter - 过滤条件
   * @returns {Promise}
   */
  static clear(filter = {}) {
    return new Promise((resolve, reject) => {
      let query = 'DELETE FROM logs';
      const params = [];
      
      // 构建过滤条件
      const filterKeys = Object.keys(filter);
      if (filterKeys.length > 0) {
        query += ' WHERE ';
        filterKeys.forEach((key, index) => {
          query += `${key} = ?`;
          if (index < filterKeys.length - 1) {
            query += ' AND ';
          }
          params.push(filter[key]);
        });
      }
      
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true, deletedCount: this.changes });
        }
      });
    });
  }

  /**
   * 计算日志总数
   * @param {Object} filter - 过滤条件
   * @returns {Promise}
   */
  static count(filter = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT COUNT(*) as count FROM logs';
      const params = [];
      
      // 构建过滤条件
      const filterKeys = Object.keys(filter);
      if (filterKeys.length > 0) {
        query += ' WHERE ';
        filterKeys.forEach((key, index) => {
          // 如果是关键字搜索，特殊处理
          if (key === 'keyword') {
            query += 'message LIKE ?';
            params.push(`%${filter[key]}%`);
          } else {
            query += `${key} = ?`;
            params.push(filter[key]);
          }
          
          if (index < filterKeys.length - 1) {
            query += ' AND ';
          }
        });
      }
      
      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(parseInt(row.count, 10));
        }
      });
    });
  }
}

module.exports = Log;
