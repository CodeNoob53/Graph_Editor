import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/Graph_Editor/',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    copyPublicDir: true,
    assetsDir: 'assets',
  },
});
