import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

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
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use 'styles/common' as *;`,
        silenceDeprecations: ['mixed-decls', 'global-builtin'],
        loadPaths: [fileURLToPath(new URL('src/', import.meta.url))],
      },
    },
  },
});
