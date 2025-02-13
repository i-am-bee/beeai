import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    svgr({
      include: '**/*.svg',
    }),
  ],
  define: {
    __APP_NAME__: JSON.stringify('BeeAI'),
  },
  server: {
    proxy: {
      '/mcp': {
        target: 'http://localhost:8333',
      },
      '/api': {
        target: 'http://localhost:8333',
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use 'styles/common' as *; @use 'sass:math';`,
        silenceDeprecations: ['mixed-decls', 'global-builtin'],
        loadPaths: [fileURLToPath(new URL('src/', import.meta.url))],
      },
    },
    modules: {
      generateScopedName: '[name]_[local]_[hash:base64:5]',
    },
  },
});
