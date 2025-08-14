# 构建前端

cd client
npm run build

# 将前端构建产物放到后端的 public 目录下

cp -r dist ../server/public

# 启动生产环境服务

cd ../server
npm start

# 注意事项

1. 需要在服务器上安装 node.js
2. 需要安装 JDK
3. 需要安装 unzip
