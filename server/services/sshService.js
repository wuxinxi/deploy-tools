const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

/**
 * 连接到远程服务器
 * @param {Object} server - 服务器配置
 * @returns {Promise} - 返回SSH连接对象
 */
async function connectToServer(server) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    
    // 准备连接配置
    const config = {
      host: server.ip,
      port: server.port || 22,
      username: server.username
    };
    
    // 使用密码或私钥认证
    if (server.privateKey) {
      config.privateKey = server.privateKey;
    } else if (server.password) {
      config.password = server.password;
    } else {
      return reject(new Error('服务器认证信息不完整（需要密码或私钥）'));
    }
    
    conn.on('ready', () => {
      resolve(conn);
    }).on('error', (err) => {
      reject(new Error(`SSH连接错误: ${err.message}`));
    }).connect(config);
  });
}

/**
 * 执行SSH命令
 * @param {Object} conn - SSH连接对象
 * @param {string} command - 要执行的命令
 * @returns {Promise} - 返回命令执行结果
 */
async function executeCommand(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        return reject(new Error(`执行命令错误: ${err.message}`));
      }
      
      let stdout = '';
      let stderr = '';
      
      stream.on('close', (code, signal) => {
        if (code !== 0) {
          return reject(new Error(`命令执行失败 (退出码: ${code}): ${stderr}`));
        }
        resolve(stdout);
      }).on('data', (data) => {
        stdout += data.toString();
      }).stderr.on('data', (data) => {
        stderr += data.toString();
      });
    });
  });
}

/**
 * 上传文件到远程服务器
 * @param {Object} conn - SSH连接对象
 * @param {string} localPath - 本地文件路径
 * @param {string} remotePath - 远程文件路径
 * @param {Function} progressCallback - 进度回调函数
 * @returns {Promise}
 */
async function uploadFile(conn, localPath, remotePath, progressCallback) {
  return new Promise((resolve, reject) => {
    // 确保远程目录存在
    const remoteDir = path.dirname(remotePath);
    executeCommand(conn, `mkdir -p ${remoteDir}`)
      .then(() => {
        // 开始上传文件
        const fileSize = fs.statSync(localPath).size;
        let uploadedSize = 0;
        
        conn.sftp((err, sftp) => {
          if (err) {
            return reject(new Error(`SFTP初始化错误: ${err.message}`));
          }
          
          const readStream = fs.createReadStream(localPath);
          
          // 监听上传进度
          readStream.on('data', (chunk) => {
            uploadedSize += chunk.length;
            if (progressCallback) {
              const progress = Math.round((uploadedSize / fileSize) * 100);
              progressCallback(progress);
            }
          });
          
          const writeStream = sftp.createWriteStream(remotePath);
          
          writeStream.on('close', () => {
            sftp.end();
            resolve();
          });
          
          writeStream.on('error', (err) => {
            reject(new Error(`文件上传错误: ${err.message}`));
          });
          
          readStream.pipe(writeStream);
        });
      })
      .catch(reject);
  });
}

/**
 * 部署后端应用
 * @param {Object} server - 服务器配置
 * @param {string} localJarPath - 本地JAR文件路径
 * @param {string} remoteTargetPath - 远程目标路径
 * @param {string} restartScriptPath - 重启脚本路径
 * @param {Function} logCallback - 日志回调函数
 * @returns {Promise}
 */
async function deployBackend(server, localJarPath, remoteTargetPath, restartScriptPath, logCallback) {
  let conn;
  
  try {
    // 1. 连接服务器
    conn = await connectToServer(server);
    if (logCallback) logCallback('已成功连接到服务器');
    
    // 2. 确保目标目录存在
    await executeCommand(conn, `mkdir -p ${remoteTargetPath}`);
    if (logCallback) logCallback(`已确保目标目录存在: ${remoteTargetPath}`);
    
    // 3. 上传JAR文件
    const fileName = path.basename(localJarPath);
    const remoteJarPath = `${remoteTargetPath}/${fileName}`;
    
    await uploadFile(conn, localJarPath, remoteJarPath, (progress) => {
      if (logCallback) logCallback(`文件上传中: ${progress}%`);
    });
    
    if (logCallback) logCallback(`JAR文件已上传至: ${remoteJarPath}`);
    
    // 4. 执行重启脚本
    if (logCallback) logCallback(`开始执行重启脚本: ${restartScriptPath}`);
    const scriptOutput = await executeCommand(conn, `chmod +x ${restartScriptPath} && ${restartScriptPath}`);
    
    if (logCallback) {
      logCallback('重启脚本执行完成');
      if (scriptOutput) logCallback(`脚本输出: ${scriptOutput.substring(0, 200)}${scriptOutput.length > 200 ? '...' : ''}`);
    }
    
    // 5. 关闭连接
    conn.end();
    if (logCallback) logCallback('已断开与服务器的连接');
    
  } catch (err) {
    if (logCallback) logCallback(`部署过程出错: ${err.message}`);
    if (conn) conn.end();
    throw err;
  }
}

/**
 * 部署前端应用
 * @param {Object} server - 服务器配置
 * @param {string} localZipPath - 本地ZIP文件路径
 * @param {string} remoteTargetPath - 远程目标路径
 * @param {boolean} reloadNginx - 是否重新加载Nginx
 * @param {Function} logCallback - 日志回调函数
 * @returns {Promise}
 */
async function deployFrontend(server, localZipPath, remoteTargetPath, reloadNginx, logCallback) {
  let conn;
  
  try {
    // 1. 连接服务器
    conn = await connectToServer(server);
    if (logCallback) logCallback('已成功连接到服务器');
    
    // 2. 确保目标目录存在
    await executeCommand(conn, `mkdir -p ${remoteTargetPath}`);
    if (logCallback) logCallback(`已确保目标目录存在: ${remoteTargetPath}`);
    
    // 3. 上传ZIP文件
    const fileName = path.basename(localZipPath);
    const remoteZipPath = `/tmp/${fileName}`; // 先上传到临时目录
    
    await uploadFile(conn, localZipPath, remoteZipPath, (progress) => {
      if (logCallback) logCallback(`文件上传中: ${progress}%`);
    });
    
    if (logCallback) logCallback(`ZIP文件已上传至临时目录: ${remoteZipPath}`);
    
    // 4. 解压文件到目标目录
    if (logCallback) logCallback(`开始解压文件到目标目录`);
    
    // 先删除目标目录下的旧文件
    await executeCommand(conn, `rm -rf ${remoteTargetPath}/*`);
    if (logCallback) logCallback('已清除目标目录中的旧文件');
    
    // 解压ZIP文件
    await executeCommand(conn, `unzip -o ${remoteZipPath} -d ${remoteTargetPath}`);
    if (logCallback) logCallback('文件解压完成');
    
    // 删除临时ZIP文件
    await executeCommand(conn, `rm -f ${remoteZipPath}`);
    if (logCallback) logCallback('已删除临时ZIP文件');
    
    // 5. 如果需要，重新加载Nginx
    if (reloadNginx) {
      if (logCallback) logCallback('开始执行 nginx -s reload');
      await executeCommand(conn, 'nginx -s reload');
      if (logCallback) logCallback('Nginx 已重新加载');
    }
    
    // 6. 关闭连接
    conn.end();
    if (logCallback) logCallback('已断开与服务器的连接');
    
  } catch (err) {
    if (logCallback) logCallback(`部署过程出错: ${err.message}`);
    if (conn) conn.end();
    throw err;
  }
}

module.exports = {
  connectToServer,
  executeCommand,
  uploadFile,
  deployBackend,
  deployFrontend
};
