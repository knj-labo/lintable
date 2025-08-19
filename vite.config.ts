import { crx } from '@crxjs/vite-plugin';
import { defineConfig } from 'vite';

// manifest.jsonを動的にインポート
const manifest = {
  manifest_version: 3,
  name: 'Lintable',
  version: '0.0.1',
  description: 'One command · One extension · Every page is lintable',
  background: {
    service_worker: 'background.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['content.ts'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['assets/*.js', '*.css'],
      matches: ['<all_urls>'],
    },
  ],
  host_permissions: ['<all_urls>'],
  permissions: ['storage', 'contextMenus', 'tabs'],
};

export default defineConfig({
  plugins: [crx({ manifest })],
  root: 'ext',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: 'lintable_[local]_[hash:base64:5]',
    },
  },
  optimizeDeps: {
    exclude: ['@crxjs/vite-plugin'],
  },
});
