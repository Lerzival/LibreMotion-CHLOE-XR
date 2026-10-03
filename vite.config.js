import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false //esto evita que Vite borre la carpeta dist y rompa el Docker
  }
});