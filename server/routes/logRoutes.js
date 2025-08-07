const express = require('express');
const router = express.Router();
const Log = require('../models/logModel');

// 获取日志列表
router.get('/', async (req, res) => {
  try {
    const { serverId, type, status, keyword, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (serverId) filter.serverId = serverId;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (keyword) filter.keyword = keyword;
    
    const logs = await Log.find({
      ...filter,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    const total = await Log.count(filter);
    
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
      message: '获取日志失败',
      error: err.message
    });
  }
});

// 获取单个日志详情
router.get('/:id', async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: '日志不存在'
      });
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

// 删除日志
router.delete('/:id', async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: '日志不存在'
      });
    }
    
    await Log.delete(req.params.id);
    
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

// 清空日志
router.delete('/', async (req, res) => {
  try {
    const { serverId, type } = req.query;
    
    const filter = {};
    if (serverId) filter.serverId = serverId;
    if (type) filter.type = type;
    
    await Log.clear(filter);
    
    res.json({
      success: true,
      message: '日志清空成功'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '清空日志失败',
      error: err.message
    });
  }
});

module.exports = router;
