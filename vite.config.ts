import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carica le variabili d'ambiente (incluso API_KEY da Vercel)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Mappa la variabile per renderla accessibile come process.env.API_KEY nel codice
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        external: ['@google/genai'],
        output: {
          globals: {
            '@google/genai': 'GoogleGenAI'
          }
        }
      }
    },
  };
});