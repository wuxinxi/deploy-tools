const db = require('../db/init');

class Server {
  /**
   * 获取服务器列表
   * @param {Object} options - 查询选项
   * @returns {Promise}
   */
  static find({ page = 1, limit = 10, ...filter }) {
    return new Promise((resolve, reject) => {
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM servers';
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
      
      // 添加分页
      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
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
   * 根据ID获取服务器
   * @param {number} id - 服务器ID
   * @returns {Promise}
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM servers WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * 创建服务器
   * @param {Object} serverData - 服务器数据
   * @returns {Promise}
   */
  static create(serverData) {
    return new Promise((resolve, reject) => {
      const { name, ip, port, username, password, remark } = serverData;
      
      db.run(
        `INSERT INTO servers (name, ip, port, username, password, remark) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, ip, port, username, password, remark || ''],
        function(err) {
          if (err) {
            reject(err);
          } else {
            // 返回创建的服务器信息
            Server.findById(this.lastID).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  /**
   * 更新服务器
   * @param {number} id - 服务器ID
   * @param {Object} serverData - 服务器数据
   * @returns {Promise}
   */
  static update(id, serverData) {
    return new Promise((resolve, reject) => {
      const { name, ip, port, username, password, remark } = serverData;
      
      db.run(
        `UPDATE servers 
         SET name = ?, ip = ?, port = ?, username = ?, password = ?, remark = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, ip, port, username, password, remark || '', id],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('服务器不存在'));
          } else {
            // 返回更新后的服务器信息
            Server.findById(id).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  /**
   * 删除服务器
   * @param {number} id - 服务器ID
   * @returns {Promise}
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM servers WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('服务器不存在'));
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  /**
   * 计算服务器总数
   * @param {Object} filter - 过滤条件
   * @returns {Promise}
   */
  static count(filter = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT COUNT(*) as count FROM servers';
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

module.exports = Server;
