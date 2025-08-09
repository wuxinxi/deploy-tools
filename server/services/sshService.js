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
            logCallback(`输出E: ${data.toString().trim()}`);
          }
        });
        
        stream.on('close', (code) => {
          if (logCallback) {
            logCallback(`命令执行完毕，退出码: ${code}`);
          }
          
          if (code !== 0) {
            return reject(new Error(`命令执行失败，退出码: ${code}, 错误信息: ${stderr}`));
          }
          const isStdoutEmpty = !stdout.trim();
          const result = isStdoutEmpty ? stderr : stdout;
        
          resolve(result);
        });
      });
    });
  }

  /**
   * 测试Java路径
   * @param {Object} conn - SSH连接对象
   * @param {string} javaPath - Java路径
   * @returns {Promise}
   */
  async testJavaPath(conn, javaPath) {
    if (!javaPath) {
      throw new Error('Java路径未配置');
    }
    
    try {
      console.log("execute command");
      
      const output = await this.executeCommand(conn, `${javaPath} -version`, (message) => {
        console.log(message);
      });
      console.log("execute command 11", output);
      return output.includes('java version') || output.includes('openjdk version');
    } catch (err) {
      console.log(err.message,'....')
      throw new Error(`Java路径测试失败: ${err.message}`);
    }
  }

  /**
   * 测试Nginx路径
   * @param {Object} conn - SSH连接对象
   * @param {string} nginxPath - Nginx路径
   * @returns {Promise}
   */
  async testNginxPath(conn, nginxPath) {
    if (!nginxPath) {
      throw new Error('Nginx路径未配置');
    }
    
    try {
      const output = await this.executeCommand(conn, `${nginxPath} -v`);
      return output.includes('nginx version');
    } catch (err) {
      throw new Error(`Nginx路径测试失败: ${err.message}`);
    }
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
   * @param {string} restartScript - 重启脚本路径
   * @param {string} serverFileName - 服务器上的文件名
   * @param {Function} logCallback - 日志回调函数
   * @returns {Promise}
   */
  async deployBackend(server, localJarPath, targetPath, restartScript, serverFileName, logCallback = null) {
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
      
      // 3. 处理文件名和备份逻辑
      const finalFileName = serverFileName || path.basename(localJarPath);
      const remoteJarPath = `${targetPath}/${finalFileName}`;
      
      // 4. 检查文件是否存在，如果存在则备份
      try {
        await this.executeCommand(
          conn,
          `test -f "${remoteJarPath}"`,
          logCallback
        );
        
        // 文件存在，创建备份
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
        const backupFileName = `${finalFileName}.bak.${currentDate}`;
        const backupPath = `${targetPath}/${backupFileName}`;
        
        await this.executeCommand(
          conn,
          `mv "${remoteJarPath}" "${backupPath}"`,
          logCallback
        );
        
        if (logCallback) {
          logCallback(`已备份原文件为: ${backupFileName}`);
        }
      } catch (err) {
        // 文件不存在，无需备份
        if (logCallback) {
          logCallback(`目标文件不存在，无需备份`);
        }
      }
      
      // 5. 上传JAR文件
      await this.uploadFile(
        conn, 
        localJarPath, 
        remoteJarPath, 
        logCallback
      );
      
      // 6. 执行重启脚本（如果提供）
      if (restartScript) {
        await this.executeCommand(
          conn, 
          restartScript, 
          logCallback
        );
      } else {
        // 默认重启命令（使用配置的Java路径）
        const javaCmd = server.javaPath ? server.javaPath : 'java';
        await this.executeCommand(
          conn, 
          `cd ${targetPath} && nohup ${javaCmd} -jar ${finalFileName} > app.log 2>&1 &`, 
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
      
      // 5. 检查并备份已存在的dist文件夹
      const distPath = `${targetPath}/dist`;
      try {
        await this.executeCommand(conn, `test -d "${distPath}"`, logCallback);
        
        // 创建备份
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
        const backupPath = `${targetPath}/dist.bak.${currentDate}`;
        await this.executeCommand(
          conn,
          `mv "${distPath}" "${backupPath}"`,
          logCallback
        );
        
        if (logCallback) {
          logCallback(`已备份原dist文件夹为: dist.bak.${currentDate}`);
        }
      } catch (err) {
        // dist文件夹不存在，无需备份
        if (logCallback) {
          logCallback(`目标dist文件夹不存在，无需备份`);
        }
      }
      
      // 6. 解压文件到目标目录
      await this.executeCommand(
        conn, 
        `unzip -o ${remoteZipPath} -d ${targetPath}`, 
        logCallback
      );
      
      // 7. 删除远程临时ZIP文件
      await this.executeCommand(
        conn, 
        `rm -f ${remoteZipPath}`, 
        logCallback
      );
      
      // 7. 如果需要，重载Nginx
      if (reloadNginx) {
        const nginxCmd = server.nginxPath ? server.nginxPath : 'nginx';
        await this.executeCommand(
          conn, 
          `sudo ${nginxCmd} -s reload`, 
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
