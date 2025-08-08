const express = require('express');
const router = express.Router();
const Server = require('../models/serverModel');
const Log = require('../models/logModel');
const sshService = require('../services/sshService');

// 获取服务器列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const servers = await Server.find({
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    const total = await Server.count();
    
    res.json({
      success: true,
      data: servers,
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
      message: '获取服务器列表失败',
      error: err.message
    });
  }
});

// 获取单个服务器
router.get('/:id', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    
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
    const { name, ip, port, username, password, javaPath, nginxPath, remark, deployPath, restartScript } = req.body;
    
    // 验证必填字段
    if (!name || !ip || !port || !username || !password) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }
    
    const server = await Server.create({
      name,
      ip,
      port,
      username,
      password,
      javaPath: javaPath || null,
      nginxPath: nginxPath || null,
      remark: remark || '',
      deployPath: deployPath || null,
      restartScript: restartScript || null
    });
    
    // 记录日志
    await Log.create({
      type: 'server_manage',
      serverId: server.id,
      message: `添加服务器: ${name} (${ip})`,
      status: 'success'
    });
    
    res.status(201).json({
      success: true,
      message: '服务器添加成功',
      data: server
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
    const { name, ip, port, username, password, javaPath, nginxPath, remark, deployPath, restartScript } = req.body;
    
    // 验证必填字段
    if (!name || !ip || !port || !username || !password) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }
    
    const server = await Server.findById(req.params.id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    const updatedServer = await Server.update(req.params.id, {
      name,
      ip,
      port,
      username,
      password,
      javaPath: javaPath || null,
      nginxPath: nginxPath || null,
      remark: remark || '',
      deployPath: deployPath || null,
      restartScript: restartScript || null
    });
    
    // 记录日志
    await Log.create({
      type: 'server_manage',
      serverId: server.id,
      message: `更新服务器: ${name} (${ip})`,
      status: 'success'
    });
    
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
    const server = await Server.findById(req.params.id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    await Server.delete(req.params.id);
    
    // 记录日志
    await Log.create({
      type: 'server_manage',
      serverId: server.id,
      message: `删除服务器: ${server.name} (${server.ip})`,
      status: 'success'
    });
    
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

// 测试SSH连接
router.post('/:id/test-ssh', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    const conn = await sshService.connectToServer(server);
    conn.end();
    
    // 更新服务器状态
    const updatedServer = await Server.update(req.params.id, {
      name: server.name,
      ip: server.ip,
      port: server.port,
      username: server.username,
      password: server.password,
      javaPath: server.javaPath,
      nginxPath: server.nginxPath,
      remark: server.remark,
      sshStatus: 'success'
    });
    
    // 记录日志
    await Log.create({
      type: 'ssh_test',
      serverId: server.id,
      message: `SSH连接测试成功: ${server.name} (${server.ip})`,
      status: 'success'
    });
    
    res.json({
      success: true,
      message: 'SSH连接测试成功'
    });
  } catch (err) {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    // 更新服务器状态
    const updatedServer = await Server.update(req.params.id, {
      name: server.name,
      ip: server.ip,
      port: server.port,
      username: server.username,
      password: server.password,
      javaPath: server.javaPath,
      nginxPath: server.nginxPath,
      remark: server.remark,
      sshStatus: 'failed'
    });
    
    // 记录错误日志
    await Log.create({
      type: 'ssh_test',
      serverId: req.params.id,
      message: `SSH连接测试失败: ${err.message}`,
      status: 'error'
    });
    
    res.status(500).json({
      success: false,
      message: 'SSH连接测试失败',
      error: err.message
    });
  }
});

// 测试Java路径
router.post('/:id/test-java', async (req, res) => {  
  try {
    const server = await Server.findById(req.params.id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    if (!server.javaPath) {
      return res.status(400).json({
        success: false,
        message: '未配置Java路径'
      });
    }
    
    const conn = await sshService.connectToServer(server);
    const valid = await sshService.testJavaPath(conn, server.javaPath);
    conn.end();
    
    // 更新服务器状态
    const updatedServer = await Server.update(req.params.id, {
      name: server.name,
      ip: server.ip,
      port: server.port,
      username: server.username,
      password: server.password,
      javaPath: server.javaPath,
      nginxPath: server.nginxPath,
      remark: server.remark,
      javaStatus: valid ? 'success' : 'failed'
    });
    
    // 记录日志
    await Log.create({
      type: 'java_test',
      serverId: server.id,
      message: `Java路径测试${valid ? '成功' : '失败'}: ${server.javaPath}`,
      status: valid ? 'success' : 'error'
    });
    
    res.json({
      success: valid,
      message: valid ? 'Java路径测试成功' : 'Java路径测试失败',
      valid
    });
  } catch (err) {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    // 更新服务器状态
    const updatedServer = await Server.update(req.params.id, {
      name: server.name,
      ip: server.ip,
      port: server.port,
      username: server.username,
      password: server.password,
      javaPath: server.javaPath,
      nginxPath: server.nginxPath,
      remark: server.remark,
      javaStatus: 'failed'
    });
    
    // 记录错误日志
    await Log.create({
      type: 'java_test',
      serverId: req.params.id,
      message: `Java路径测试失败: ${err.message}`,
      status: 'error'
    });
    
    res.status(500).json({
      success: false,
      message: 'Java路径测试失败',
      error: err.message
    });
  }
});

// 测试Nginx路径
router.post('/:id/test-nginx', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    if (!server.nginxPath) {
      return res.status(400).json({
        success: false,
        message: '未配置Nginx路径'
      });
    }
    
    const conn = await sshService.connectToServer(server);
    const valid = await sshService.testNginxPath(conn, server.nginxPath);
    conn.end();
    
    // 更新服务器状态
    const updatedServer = await Server.update(req.params.id, {
      name: server.name,
      ip: server.ip,
      port: server.port,
      username: server.username,
      password: server.password,
      javaPath: server.javaPath,
      nginxPath: server.nginxPath,
      remark: server.remark,
      nginxStatus: valid ? 'success' : 'failed'
    });
    
    // 记录日志
    await Log.create({
      type: 'nginx_test',
      serverId: server.id,
      message: `Nginx路径测试${valid ? '成功' : '失败'}: ${server.nginxPath}`,
      status: valid ? 'success' : 'error'
    });
    
    res.json({
      success: true,
      message: valid ? 'Nginx路径测试成功' : 'Nginx路径测试失败',
      valid
    });
  } catch (err) {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    // 更新服务器状态
    const updatedServer = await Server.update(req.params.id, {
      name: server.name,
      ip: server.ip,
      port: server.port,
      username: server.username,
      password: server.password,
      javaPath: server.javaPath,
      nginxPath: server.nginxPath,
      remark: server.remark,
      nginxStatus: 'failed'
    });
    
    // 记录错误日志
    await Log.create({
      type: 'nginx_test',
      serverId: req.params.id,
      message: `Nginx路径测试失败: ${err.message}`,
      status: 'error'
    });
    
    res.status(500).json({
      success: false,
      message: 'Nginx路径测试失败',
      error: err.message
    });
  }
});

module.exports = router;
