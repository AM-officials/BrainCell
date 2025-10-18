import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, './src') }],
  },
  optimizeDeps: {
    exclude: ['@tensorflow/tfjs', 'recordrtc', 'mermaid', '@monaco-editor/react'],
  },
  build: {
    commonjsOptions: {
      defaultIsModuleExports: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'state-vendor': ['zustand'],
          'network-vendor': ['axios'],
          'graph-vendor': ['reactflow'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
