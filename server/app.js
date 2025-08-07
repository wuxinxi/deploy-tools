const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')

// 初始化Express应用
const app = express()
const PORT = process.env.PORT || 3000

// 创建必要的目录
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

// 中间件
app.use(cors()) // 允许跨域请求
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

// 路由 - 注意这里添加了/api前缀
const serverRoutes = require('./routes/serverRoutes')
const deployRoutes = require('./routes/deployRoutes')
const logRoutes = require('./routes/logRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')

// 所有API路由都添加/api前缀
app.use('/api/servers', serverRoutes)
app.use('/api/deploy', deployRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/dashboard', dashboardRoutes)

// 根路由
app.get('/', (req, res) => {
  res.send('运维自动化部署工具API服务')
})

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API地址不存在: ${req.method} ${req.originalUrl}`,
  })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: err.message,
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log(`API基础路径: http://localhost:${PORT}/api`)
})

module.exports = app
