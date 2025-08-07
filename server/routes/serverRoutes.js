const express = require('express');
const router = express.Router();

// 服务器路由模块 - 接收db参数
module.exports = function(db) {
  // 获取所有服务器
  router.get('/', async (req, res) => {
    try {
      const servers = await db.all('SELECT * FROM servers ORDER BY updatedAt DESC');
      res.json({
        success: true,
        data: servers
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '获取服务器列表失败',
        error: err.message
      });
    }
  });

  // 获取单个服务器
  router.get('/:id', async (req, res) => {
    try {
      const server = await db.get('SELECT * FROM servers WHERE id = ?', [req.params.id]);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          message: '服务器不存在'
        });
      }
      
      res.json({
        success: true,
        data: server
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '获取服务器信息失败',
        error: err.message
      });
    }
  });

  // 添加服务器
  router.post('/', async (req, res) => {
    try {
      const { name, ip, port, username, password, privateKey, description } = req.body;
      
      if (!name || !ip || !username) {
        return res.status(400).json({
          success: false,
          message: '服务器名称、IP地址和用户名不能为空'
        });
      }
      
      const result = await db.run(
        `INSERT INTO servers (name, ip, port, username, password, privateKey, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, ip, port || 22, username, password, privateKey, description]
      );
      
      const newServer = await db.get('SELECT * FROM servers WHERE id = ?', [result.lastID]);
      
      res.status(201).json({
        success: true,
        message: '服务器添加成功',
        data: newServer
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '添加服务器失败',
        error: err.message
      });
    }
  });

  // 更新服务器
  router.put('/:id', async (req, res) => {
    try {
      const { name, ip, port, username, password, privateKey, description } = req.body;
      
      if (!name || !ip || !username) {
        return res.status(400).json({
          success: false,
          message: '服务器名称、IP地址和用户名不能为空'
        });
      }
      
      // 检查服务器是否存在
      const existingServer = await db.get('SELECT * FROM servers WHERE id = ?', [req.params.id]);
      if (!existingServer) {
        return res.status(404).json({
          success: false,
          message: '服务器不存在'
        });
      }
      
      await db.run(
        `UPDATE servers SET 
         name = ?, ip = ?, port = ?, username = ?, password = ?, 
         privateKey = ?, description = ?, updatedAt = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [name, ip, port || 22, username, password, privateKey, description, req.params.id]
      );
      
      const updatedServer = await db.get('SELECT * FROM servers WHERE id = ?', [req.params.id]);
      
      res.json({
        success: true,
        message: '服务器更新成功',
        data: updatedServer
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '更新服务器失败',
        error: err.message
      });
    }
  });

  // 删除服务器
  router.delete('/:id', async (req, res) => {
    try {
      // 检查服务器是否存在
      const server = await db.get('SELECT * FROM servers WHERE id = ?', [req.params.id]);
      if (!server) {
        return res.status(404).json({
          success: false,
          message: '服务器不存在'
        });
      }
      
      // 删除服务器
      await db.run('DELETE FROM servers WHERE id = ?', [req.params.id]);
      
      // 同时删除关联的日志
      await db.run('DELETE FROM logs WHERE serverId = ?', [req.params.id]);
      
      res.json({
        success: true,
        message: '服务器删除成功'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '删除服务器失败',
        error: err.message
      });
    }
  });

  return router;
};
