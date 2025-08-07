const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

class SSHService {
  /**
   * 连接到服务器
   * @param {Object} server - 服务器配置
   * @returns {Promise}
   */
  connectToServer(server) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on('ready', () => {
        resolve(conn);
      }).on('error', (err) => {
        reject(new Error(`SSH连接错误: ${err.message}`));
      }).connect({
        host: server.ip,
        port: server.port || 22,
        username: server.username,
        password: server.password,
        // 超时设置为30秒
        readyTimeout: 30000
      });
    });
  }

  /**
   * 在远程服务器上执行命令
   * @param {Object} conn - SSH连接对象
   * @param {string} command - 要执行的命令
   * @param {Function} logCallback - 日志回调函数
   * @returns {Promise}
   */
  executeCommand(conn, command, logCallback = null) {
    return new Promise((resolve, reject) => {
      if (logCallback) {
        logCallback(`执行命令: ${command}`);
      }
      
      conn.exec(command, (err, stream) => {
        if (err) {
          if (logCallback) {
            logCallback(`命令执行错误: ${err.message}`);
          }
          return reject(err);
        }
        
        let stdout = '';
        let stderr = '';
        
        stream.on('data', (data) => {
          stdout += data.toString();
          if (logCallback) {
            logCallback(`输出: ${data.toString().trim()}`);
          }
        });
        
        stream.stderr.on('data', (data) => {
          stderr += data.toString();
          if (logCallback) {
            logCallback(`错误: ${data.toString().trim()}`);
          }
        });
        
        stream.on('close', (code) => {
          if (logCallback) {
            logCallback(`命令执行完毕，退出码: ${code}`);
          }
          
          if (code !== 0) {
            return reject(new Error(`命令执行失败，退出码: ${code}, 错误信息: ${stderr}`));
          }
          
          resolve(stdout);
        });
      });
    });
  }

  /**
   * 上传文件到远程服务器
   * @param {Object} conn - SSH连接对象
   * @param {string} localPath - 本地文件路径
   * @param {string} remotePath - 远程文件路径
   * @param {Function} logCallback - 日志回调函数
   * @returns {Promise}
   */
  uploadFile(conn, localPath, remotePath, logCallback = null) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(localPath)) {
        return reject(new Error(`本地文件不存在: ${localPath}`));
      }
      
      if (logCallback) {
        logCallback(`开始上传文件: ${localPath} 到 ${remotePath}`);
      }
      
      conn.sftp((err, sftp) => {
        if (err) {
          if (logCallback) {
            logCallback(`SFTP连接错误: ${err.message}`);
          }
          return reject(err);
        }
        
        const readStream = fs.createReadStream(localPath);
        const writeStream = sftp.createWriteStream(remotePath);
        
        writeStream.on('close', () => {
          sftp.end();
          if (logCallback) {
            logCallback(`文件上传成功: ${remotePath}`);
          }
          resolve();
        });
        
        writeStream.on('error', (err) => {
          if (logCallback) {
            logCallback(`文件上传错误: ${err.message}`);
          }
          reject(err);
        });
        
        readStream.pipe(writeStream);
      });
    });
  }

  /**
   * 部署后端应用
   * @param {Object} server - 服务器配置
   * @param {string} localJarPath - 本地JAR文件路径
   * @param {string} targetPath - 远程目标路径
   * @param {string} restartScript - 重启脚本
   * @param {Function} logCallback - 日志回调函数
   * @returns {Promise}
   */
  async deployBackend(server, localJarPath, targetPath, restartScript, logCallback = null) {
    let conn = null;
    
    try {
      // 1. 连接服务器
      conn = await this.connectToServer(server);
      if (logCallback) {
        logCallback(`成功连接到服务器: ${server.ip}`);
      }
      
      // 2. 确保目标目录存在
      await this.executeCommand(
        conn, 
        `mkdir -p ${targetPath}`, 
        logCallback
      );
      
      // 3. 获取文件名
      const jarFileName = path.basename(localJarPath);
      const remoteJarPath = `${targetPath}/${jarFileName}`;
      
      // 4. 上传JAR文件
      await this.uploadFile(
        conn, 
        localJarPath, 
        remoteJarPath, 
        logCallback
      );
      
      // 5. 执行重启脚本（如果提供）
      if (restartScript) {
        await this.executeCommand(
          conn, 
          restartScript, 
          logCallback
        );
      } else {
        // 默认重启命令（简单示例）
        await this.executeCommand(
          conn, 
          `cd ${targetPath} && nohup java -jar ${jarFileName} > app.log 2>&1 &`, 
          logCallback
        );
      }
      
      if (logCallback) {
        logCallback('后端应用部署完成');
      }
    } finally {
      // 确保连接关闭
      if (conn) {
        conn.end();
      }
      
      // 删除本地临时文件
      if (fs.existsSync(localJarPath)) {
        fs.unlinkSync(localJarPath);
        if (logCallback) {
          logCallback(`已删除本地临时文件: ${localJarPath}`);
        }
      }
    }
  }

  /**
   * 部署前端应用
   * @param {Object} server - 服务器配置
   * @param {string} localZipPath - 本地ZIP文件路径
   * @param {string} targetPath - 远程目标路径
   * @param {boolean} reloadNginx - 是否重载Nginx
   * @param {Function} logCallback - 日志回调函数
   * @returns {Promise}
   */
  async deployFrontend(server, localZipPath, targetPath, reloadNginx = false, logCallback = null) {
    let conn = null;
    
    try {
      // 1. 连接服务器
      conn = await this.connectToServer(server);
      if (logCallback) {
        logCallback(`成功连接到服务器: ${server.ip}`);
      }
      
      // 2. 确保目标目录存在
      await this.executeCommand(
        conn, 
        `mkdir -p ${targetPath}`, 
        logCallback
      );
      
      // 3. 获取文件名
      const zipFileName = path.basename(localZipPath);
      const remoteZipPath = `/tmp/${zipFileName}`; // 先传到tmp目录
      
      // 4. 上传ZIP文件
      await this.uploadFile(
        conn, 
        localZipPath, 
        remoteZipPath, 
        logCallback
      );
      
      // 5. 解压文件到目标目录
      await this.executeCommand(
        conn, 
        `unzip -o ${remoteZipPath} -d ${targetPath}`, 
        logCallback
      );
      
      // 6. 删除远程临时ZIP文件
      await this.executeCommand(
        conn, 
        `rm -f ${remoteZipPath}`, 
        logCallback
      );
      
      // 7. 如果需要，重载Nginx
      if (reloadNginx) {
        await this.executeCommand(
          conn, 
          'sudo systemctl reload nginx', 
          logCallback
        );
      }
      
      if (logCallback) {
        logCallback('前端应用部署完成');
      }
    } finally {
      // 确保连接关闭
      if (conn) {
        conn.end();
      }
      
      // 删除本地临时文件
      if (fs.existsSync(localZipPath)) {
        fs.unlinkSync(localZipPath);
        if (logCallback) {
          logCallback(`已删除本地临时文件: ${localZipPath}`);
        }
      }
    }
  }
}

module.exports = new SSHService();
