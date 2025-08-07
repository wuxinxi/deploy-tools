const express = require('express')
const router = express.Router()
const Server = require('../models/serverModel')
const Log = require('../models/logModel')

// 获取仪表盘统计数据
router.get('/stats', async (req, res) => {
  try {
    // 服务器总数
    const serverCount = await Server.count()

    // 今日部署次数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deployLogsToday = await Log.find({
      type: { $in: ['backend_deploy', 'frontend_deploy'] },
      createdAt: { $gte: today.toISOString() },
    })
    const deployCountToday = deployLogsToday.length

    // 部署成功率
    const allDeployLogs = await Log.find({
      type: { $in: ['backend_deploy', 'frontend_deploy'] },
    })

    const successCount = allDeployLogs.filter(
      (log) => log.status === 'success'
    ).length
    const successRate =
      allDeployLogs.length > 0
        ? Math.round((successCount / allDeployLogs.length) * 100)
        : 100

    res.json({
      success: true,
      data: {
        serverCount,
        deployCountToday,
        successRate,
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取仪表盘统计数据失败',
      error: err.message,
    })
  }
})

// 获取最近部署记录
router.get('/recent-deployments', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10

    // 获取最近的部署日志
    const deployLogs = await Log.find(
      {
        type: { $in: ['backend_deploy', 'frontend_deploy'] },
      },
      { limit, sort: { createdAt: -1 } }
    )

    // 为每条日志添加服务器名称
    const logsWithServerInfo = []
    for (const log of deployLogs) {
      if (log.serverId) {
        const server = await Server.findById(log.serverId)
        logsWithServerInfo.push({
          id: log.id,
          time: log.createdAt,
          serverName: server ? server.name : '未知服务器',
          type: log.type === 'backend_deploy' ? 'backend' : 'frontend',
          status: log.status,
          message:
            log.message.substring(0, 100) +
            (log.message.length > 100 ? '...' : ''),
        })
      }
    }

    res.json({
      success: true,
      data: logsWithServerInfo,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取最近部署记录失败',
      error: err.message,
    })
  }
})

module.exports = router
