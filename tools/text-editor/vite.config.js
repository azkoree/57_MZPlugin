import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// 开发模式：vite 端口 5173，/api 请求代理到 Express 后端 3001
export default defineConfig({
    plugins: [vue()],
    server: {
        port: 5173,
        proxy: {
            "/api": "http://localhost:3001"
        }
    },
    build: {
        outDir: "dist"
    }
});
