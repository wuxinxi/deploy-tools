import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'axios',
      'element-plus',
      '@element-plus/icons-vue',
    ],
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 后端服务地址
        changeOrigin: true, // 处理跨域
        rewrite: (path) => path, // 保留完整路径，不删除/api前缀
        // 可选：开启代理日志，方便调试
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(
              `代理请求: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`
            )
          })
        },
      },
    },
  },
})
