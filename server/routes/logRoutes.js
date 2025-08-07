const express = require('express');
const router = express.Router();

module.exports = function(db) {
  // 获取日志列表
  router.get('/', async (req, res) => {
    try {
      const { 
        serverId, 
        type, 
        status, 
        page = 1, 
        limit = 10,
        startDate,
        endDate
      } = req.query;
      
      // 构建查询条件
      const conditions = [];
      const params = [];
      
      if (serverId) {
        conditions.push('serverId = ?');
        params.push(serverId);
      }
      
      if (type) {
        conditions.push('type = ?');
        params.push(type);
      }
      
      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }
      
      if (startDate) {
        conditions.push('createdAt >= ?');
        params.push(startDate);
      }
      
      if (endDate) {
        conditions.push('createdAt <= ?');
        params.push(endDate);
      }
      
      // 构建SQL查询
      const whereClause = conditions.length 
        ? `WHERE ${conditions.join(' AND ')}` 
        : '';
      
      // 获取总数
      const countResult = await db.get(
        `SELECT COUNT(*) as total FROM logs ${whereClause}`,
        params
      );
      const total = countResult.total;
      
      // 计算分页
      const offset = (page - 1) * limit;
      const paginationParams = [...params, limit, offset];
      
      // 获取日志列表
      const logs = await db.all(
        `SELECT * FROM logs ${whereClause} 
         ORDER BY createdAt DESC 
         LIMIT ? OFFSET ?`,
        paginationParams
      );
      
      // 获取关联的服务器名称
      for (const log of logs) {
        if (log.serverId) {
          const server = await db.get(
            'SELECT name FROM servers WHERE id = ?',
            [log.serverId]
          );
          log.serverName = server ? server.name : '未知服务器';
        } else {
          log.serverName = '无关联服务器';
        }
      }
      
      res.json({
        success: true,
        data: logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '获取日志列表失败',
        error: err.message
      });
    }
  });

  // 获取单个日志详情
  router.get('/:id', async (req, res) => {
    try {
      const log = await db.get(
        'SELECT * FROM logs WHERE id = ?',
        [req.params.id]
      );
      
      if (!log) {
        return res.status(404).json({
          success: false,
          message: '日志不存在'
        });
      }
      
      // 获取关联的服务器信息
      if (log.serverId) {
        const server = await db.get(
          'SELECT id, name, ip FROM servers WHERE id = ?',
          [log.serverId]
        );
        log.serverInfo = server;
      }
      
      res.json({
        success: true,
        data: log
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '获取日志详情失败',
        error: err.message
      });
    }
  });

  // 删除单个日志
  router.delete('/:id', async (req, res) => {
    try {
      // 检查日志是否存在
      const log = await db.get(
        'SELECT id FROM logs WHERE id = ?',
        [req.params.id]
      );
      
      if (!log) {
        return res.status(404).json({
          success: false,
          message: '日志不存在'
        });
      }
      
      // 删除日志
      await db.run(
        'DELETE FROM logs WHERE id = ?',
        [req.params.id]
      );
      
      res.json({
        success: true,
        message: '日志删除成功'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '删除日志失败',
        error: err.message
      });
    }
  });

  // 批量删除日志
  router.delete('/', async (req, res) => {
    try {
      const { ids, serverId, type, olderThan } = req.body;
      
      if (!ids && !serverId && !type && !olderThan) {
        return res.status(400).json({
          success: false,
          message: '请提供删除条件'
        });
      }
      
      // 构建删除条件
      const conditions = [];
      const params = [];
      
      if (ids && ids.length > 0) {
        conditions.push(`id IN (${ids.map(() => '?').join(',')})`);
        params.push(...ids);
      }
      
      if (serverId) {
        conditions.push('serverId = ?');
        params.push(serverId);
      }
      
      if (type) {
        conditions.push('type = ?');
        params.push(type);
      }
      
      if (olderThan) {
        conditions.push('createdAt < ?');
        params.push(olderThan);
      }
      
      // 执行删除
      const result = await db.run(
        `DELETE FROM logs WHERE ${conditions.join(' AND ')}`,
        params
      );
      
      res.json({
        success: true,
        message: `成功删除 ${result.changes} 条日志`,
        deletedCount: result.changes
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '批量删除日志失败',
        error: err.message
      });
    }
  });

  return router;
};
