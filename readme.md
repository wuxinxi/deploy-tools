# 构建前端

cd client
npm run build

# 将前端构建产物放到后端的 public 目录下

cp -r dist ../server/public

# 启动生产环境服务

cd ../server
npm start
