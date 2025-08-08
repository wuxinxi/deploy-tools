#!/bin/bash
# JAR应用启动脚本
# 使用方法: ./start.sh [start|stop|restart|status]

# 配置参数
APP_NAME="healthy.jar"  # JAR包文件名
APP_PATH=$(cd $(dirname $0); pwd)  # 脚本所在目录（JAR包需放在同目录或修改为绝对路径）
LOG_PATH="${APP_PATH}/logs"  # 日志目录
LOG_FILE="${LOG_PATH}/app.log"  # 日志文件
PORT=8080  # 应用端口（用于检查是否启动）
JAVA_OPTS="-Xms512m -Xmx1024m -Dfile.encoding=UTF-8"  # JVM参数

JAVA="/usr/local/java/jdk8u382-b05-jre/bin/java"

# 创建日志目录
if [ ! -d "${LOG_PATH}" ]; then
  mkdir -p "${LOG_PATH}"
fi

# 检查进程是否运行
check_running() {
  # 通过端口或JAR包名检查
  local pid=$(netstat -tpln | grep ":${PORT}" | awk '{print $7}' | cut -d/ -f1)
  if [ -z "${pid}" ]; then
    pid=$(ps -ef | grep "${APP_NAME}" | grep -v grep | awk '{print $2}')
  fi
  echo "${pid}"
}

# 启动应用
start() {
  local pid=$(check_running)
  if [ -n "${pid}" ]; then
    echo "应用 ${APP_NAME} 已启动，进程ID: ${pid}"
    return 0
  fi

  echo "开始启动 ${APP_NAME} ..."
  # 后台启动并输出日志
  nohup ${JAVA} ${JAVA_OPTS} -jar "${APP_PATH}/${APP_NAME}" > "${LOG_FILE}" 2>&1 &

  # 等待启动完成
  sleep 3
  local new_pid=$(check_running)
  if [ -n "${new_pid}" ]; then
    echo "应用 ${APP_NAME} 启动成功，进程ID: ${new_pid}"
    echo "日志路径: ${LOG_FILE}"
  else
    echo "应用启动失败，请查看日志: ${LOG_FILE}"
  fi
}

# 停止应用
stop() {
  local pid=$(check_running)
  if [ -z "${pid}" ]; then
    echo "应用 ${APP_NAME} 未在运行"
    return 0
  fi

  echo "开始停止 ${APP_NAME} (进程ID: ${pid}) ..."
  kill "${pid}"

  # 等待停止
  sleep 3
  local remaining_pid=$(check_running)
  if [ -z "${remaining_pid}" ]; then
    echo "应用已停止"
  else
    echo "强制终止应用..."
    kill -9 "${remaining_pid}"
    echo "应用已强制停止"
  fi
}

# 重启应用
restart() {
  stop
  start
}

# 查看状态
status() {
  local pid=$(check_running)
  if [ -n "${pid}" ]; then
    echo "应用 ${APP_NAME} 正在运行，进程ID: ${pid}"
  else
    echo "应用 ${APP_NAME} 未在运行"
  fi
}

# 获取命令参数，默认为 restart
COMMAND=${1:-restart}

# 命令处理
case "${COMMAND}" in
  "start")
    start
    ;;
  "stop")
    stop
    ;;
  "restart")
    restart
    ;;
  "status")
    status
    ;;
  *)
    echo "使用方法: $0 [start|stop|restart|status]"
    exit 1
    ;;
esac