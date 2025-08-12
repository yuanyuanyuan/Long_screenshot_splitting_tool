import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile({
      removeViteModuleLoader: true,
      useRecommendedBuildConfig: true,
    }),
  ],
  build: {
    rollupOptions: {
      external: ['react', 'react-dom', 'jszip', 'jspdf'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          jszip: 'JSZip',
          jspdf: 'jsPDF',
        },
      },
    },
    target: 'es2015',
    minify: 'terser',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, // 100MB - inline all assets
  },
  // publicDir: 'public', // Enable public directory for worker files
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
