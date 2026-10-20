import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false, 
    rollupOptions: {
      output: {
        // Elimina los hashes dinámicos de los archivos generados
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
});