const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { connectToServer, deployBackend, deployFrontend } = require('../services/sshService');

// 确保uploads目录存在
const uploadDir = path.join(__dirname, '../uploads');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'jarFile' ? 'backend' : 'frontend';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'jarFile') {
    // 只允许JAR文件
    if (file.originalname.endsWith('.jar')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传JAR文件'), false);
    }
  } else if (file.fieldname === 'distFile') {
    // 只允许ZIP文件
    if (file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传ZIP文件'), false);
    }
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 创建上传中间件
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// 测试服务器连接
router.post('/test-connection', async (req, res) => {
  const { serverId } = req.body;
  
  if (!serverId) {
    return res.status(400).json({
      success: false,
      message: '服务器ID不能为空'
    });
  }
  
  try {
    // 获取服务器信息
    const db = req.app.get('db') || require('../app').db;
    const server = await db.get('SELECT * FROM servers WHERE id = ?', [serverId]);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    // 尝试连接服务器
    const conn = await connectToServer(server);
    conn.end();
    
    // 记录日志
    await db.run(
      `INSERT INTO logs (type, serverId, message, status) 
       VALUES (?, ?, ?, ?)`,
      ['connection_test', serverId, '服务器连接测试成功', 'success']
    );
    
    res.json({
      success: true,
      message: '服务器连接成功'
    });
  } catch (err) {
    try {
      // 记录错误日志
      const db = req.app.get('db') || require('../app').db;
      await db.run(
        `INSERT INTO logs (type, serverId, message, status) 
         VALUES (?, ?, ?, ?)`,
        ['connection_test', serverId, `服务器连接失败: ${err.message}`, 'error']
      );
    } catch (logErr) {
      console.error('记录日志失败:', logErr);
    }
    
    res.status(500).json({
      success: false,
      message: '服务器连接失败',
      error: err.message
    });
  }
});

// 部署后端应用
router.post('/backend', upload.single('jarFile'), async (req, res) => {
  try {
    const { serverId, targetPath, restartScript } = req.body;
    const db = req.app.get('db') || require('../app').db;
    
    // 验证参数
    if (!serverId || !targetPath || !restartScript) {
      return res.status(400).json({
        success: false,
        message: '服务器ID、目标路径和重启脚本不能为空'
      });
    }
    
    // 验证文件
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传JAR文件'
      });
    }
    
    // 获取服务器信息
    const server = await db.get('SELECT * FROM servers WHERE id = ?', [serverId]);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    // 创建部署日志
    const logResult = await db.run(
      `INSERT INTO logs (type, serverId, message, status) 
       VALUES (?, ?, ?, ?)`,
      ['backend_deploy', serverId, '开始部署后端应用', 'pending']
    );
    const logId = logResult.lastID;
    
    // 日志更新函数
    const updateLog = async (message, status = null) => {
      const log = await db.get('SELECT message FROM logs WHERE id = ?', [logId]);
      const newMessage = `${log.message}\n${new Date().toLocaleString()}: ${message}`;
      
      const params = [newMessage, new Date()];
      let sql = `UPDATE logs SET message = ?, updatedAt = ? WHERE id = ?`;
      
      if (status) {
        sql = `UPDATE logs SET message = ?, updatedAt = ?, status = ?, completedAt = ? WHERE id = ?`;
        params.push(status, new Date());
      }
      
      params.push(logId);
      await db.run(sql, params);
    };
    
    try {
      // 执行部署
      await updateLog(`开始上传文件: ${req.file.originalname}`);
      
      await deployBackend(
        server,
        req.file.path,
        targetPath,
        restartScript,
        async (message) => {
          await updateLog(message);
        }
      );
      
      // 部署成功
      await updateLog('后端应用部署完成', 'success');
      
      // 删除本地临时文件
      await fs.unlink(req.file.path).catch(err => 
        console.warn('删除临时文件失败:', err.message)
      );
      
      res.json({
        success: true,
        message: '后端应用部署成功',
        logId: logId
      });
    } catch (deployErr) {
      // 部署失败
      await updateLog(`部署失败: ${deployErr.message}`, 'error');
      
      // 删除本地临时文件
      await fs.unlink(req.file.path).catch(err => 
        console.warn('删除临时文件失败:', err.message)
      );
      
      throw deployErr;
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '后端部署失败',
      error: err.message
    });
  }
});

// 部署前端应用
router.post('/frontend', upload.single('distFile'), async (req, res) => {
  try {
    const { serverId, targetPath, reloadNginx } = req.body;
    const db = req.app.get('db') || require('../app').db;
    
    // 验证参数
    if (!serverId || !targetPath) {
      return res.status(400).json({
        success: false,
        message: '服务器ID和目标路径不能为空'
      });
    }
    
    // 验证文件
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传ZIP文件'
      });
    }
    
    // 获取服务器信息
    const server = await db.get('SELECT * FROM servers WHERE id = ?', [serverId]);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器不存在'
      });
    }
    
    // 创建部署日志
    const logResult = await db.run(
      `INSERT INTO logs (type, serverId, message, status) 
       VALUES (?, ?, ?, ?)`,
      ['frontend_deploy', serverId, '开始部署前端应用', 'pending']
    );
    const logId = logResult.lastID;
    
    // 日志更新函数
    const updateLog = async (message, status = null) => {
      const log = await db.get('SELECT message FROM logs WHERE id = ?', [logId]);
      const newMessage = `${log.message}\n${new Date().toLocaleString()}: ${message}`;
      
      const params = [newMessage, new Date()];
      let sql = `UPDATE logs SET message = ?, updatedAt = ? WHERE id = ?`;
      
      if (status) {
        sql = `UPDATE logs SET message = ?, updatedAt = ?, status = ?, completedAt = ? WHERE id = ?`;
        params.push(status, new Date());
      }
      
      params.push(logId);
      await db.run(sql, params);
    };
    
    try {
      // 执行部署
      await updateLog(`开始上传文件: ${req.file.originalname}`);
      
      await deployFrontend(
        server,
        req.file.path,
        targetPath,
        reloadNginx === 'true' || reloadNginx === true,
        async (message) => {
          await updateLog(message);
        }
      );
      
      // 部署成功
      await updateLog('前端应用部署完成', 'success');
      
      // 删除本地临时文件
      await fs.unlink(req.file.path).catch(err => 
        console.warn('删除临时文件失败:', err.message)
      );
      
      res.json({
        success: true,
        message: '前端应用部署成功',
        logId: logId
      });
    } catch (deployErr) {
      // 部署失败
      await updateLog(`部署失败: ${deployErr.message}`, 'error');
      
      // 删除本地临时文件
      await fs.unlink(req.file.path).catch(err => 
        console.warn('删除临时文件失败:', err.message)
      );
      
      throw deployErr;
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '前端部署失败',
      error: err.message
    });
  }
});

module.exports = function(db) {
  // 将数据库连接附加到请求对象
  router.use((req, res, next) => {
    req.db = db;
    next();
  });
  return router;
};
