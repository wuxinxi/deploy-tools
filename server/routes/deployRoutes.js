const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sshService = require('../services/sshService');
const Server = require('../models/serverModel');
const Log = require('../models/logModel');

// 配置文件上传目录
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 后端JAR文件上传配置
const jarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'backend-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const jarUpload = multer({
  storage: jarStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/java-archive' || 
        file.originalname.endsWith('.jar')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传JAR文件'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// 前端ZIP文件上传配置
const distStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'frontend-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const distUpload = multer({
  storage: distStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || 
        file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传ZIP文件'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 部署后端应用
router.post('/backend', jarUpload.single('jarFile'), async (req, res) => {
  try {
    const { serverId, targetPath, restartScript, serverFileName } = req.body;
    
    // 验证参数
    if (!serverId || !targetPath) {
      return res.status(400).json({ 
        success: false, 
        message: '服务器ID和目标路径为必填项' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: '请上传JAR文件' 
      });
    }
    
    // 获取服务器信息
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ 
        success: false, 
        message: '服务器不存在' 
      });
    }
    
    // 创建日志记录
    const log = await Log.create({
      type: 'backend_deploy',
      serverId: server.id,
      message: `开始部署后端应用到 ${server.name} (${server.ip})`,
      status: 'pending'
    });
    
    // 日志回调函数
    const logCallback = async (message) => {
      console.log(`[部署日志] ${message}`);
      // 获取当前日志内容
      const currentLog = await Log.findById(log.id);
      // 更新日志 - 确保立即刷新
      await Log.update(log.id, {
        message: `${currentLog.message}\n${message}`,
        updatedAt: new Date()
      });
    };
    
    // 执行部署
    await sshService.deployBackend(
      server, 
      req.file.path, 
      targetPath, 
      restartScript,
      serverFileName, // 添加服务器文件名参数
      logCallback
    );
    
    // 更新日志状态
    await Log.update(log.id, {
      status: 'success',
      completedAt: new Date(),
      message: `${log.message}\n部署完成`
    });
    
    res.json({ 
      success: true, 
      message: '后端部署完成',
      logId: log.id
    });
  } catch (err) {
    // 记录错误日志
    if (req.body.serverId && req.body.logId) {
      await Log.update(req.body.logId, {
        status: 'error',
        message: `部署失败: ${err.message}`,
        completedAt: new Date()
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: '部署失败', 
      error: err.message 
    });
  }
});

// 部署前端应用
router.post('/frontend', distUpload.single('distFile'), async (req, res) => {
  try {
    const { serverId, targetPath, reloadNginx } = req.body;
    
    // 验证参数
    if (!serverId || !targetPath) {
      return res.status(400).json({ 
        success: false, 
        message: '服务器ID和目标路径为必填项' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: '请上传ZIP文件' 
      });
    }
    
    // 获取服务器信息
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ 
        success: false, 
        message: '服务器不存在' 
      });
    }
    
    // 创建日志记录
    const log = await Log.create({
      type: 'frontend_deploy',
      serverId: server.id,
      message: `开始部署前端应用到 ${server.name} (${server.ip})`,
      status: 'pending'
    });
    
    // 日志回调函数
    const logCallback = async (message) => {
      console.log(`[部署日志] ${message}`);
      // 获取当前日志内容
      const currentLog = await Log.findById(log.id);
      // 更新日志 - 确保立即刷新
      await Log.update(log.id, {
        message: `${currentLog.message}\n${message}`,
        updatedAt: new Date()
      });
    };
    
    // 执行部署
    await sshService.deployFrontend(
      server, 
      req.file.path, 
      targetPath, 
      reloadNginx === 'true' || reloadNginx === true,
      logCallback
    );
    
    // 更新日志状态
    await Log.update(log.id, {
      status: 'success',
      completedAt: new Date(),
      message: `${log.message}\n部署完成`
    });
    
    res.json({ 
      success: true, 
      message: '前端部署完成',
      logId: log.id
    });
  } catch (err) {
    // 记录错误日志
    if (req.body.serverId && req.body.logId) {
      await Log.update(req.body.logId, {
        status: 'error',
        message: `部署失败: ${err.message}`,
        completedAt: new Date()
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: '部署失败', 
      error: err.message 
    });
  }
});

module.exports = router;
