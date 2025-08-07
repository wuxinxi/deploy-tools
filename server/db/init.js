const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, 'ops.db');

// 检查数据库目录是否存在，不存在则创建
if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接错误:', err.message);
  } else {
    console.log('成功连接到SQLite数据库');
    createTables();
  }
});

// 创建数据表
function createTables() {
  // 服务器表
  db.run(`
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 22,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      remark TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建servers表错误:', err.message);
    } else {
      console.log('servers表已创建或已存在');
    }
  });

  // 日志表
  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      serverId INTEGER,
      message TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completedAt TIMESTAMP,
      FOREIGN KEY (serverId) REFERENCES servers(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建logs表错误:', err.message);
    } else {
      console.log('logs表已创建或已存在');
    }
  });
}

// 导出数据库连接
module.exports = db;
