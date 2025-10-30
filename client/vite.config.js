/*
実行例: npm run dev
概要: ViteでReactアプリを開発するための設定とAPIプロキシ、テスト設定をまとめる。
*/
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
                secure: false,
            },
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./src/setupTests.ts",
    },
});
