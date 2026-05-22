import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        lavaAndMeatballs: resolve(__dirname, 'pages/lava-and-meatballs.html'),
        lavalamp: resolve(__dirname, 'pages/lavalamp.html'),
        original: resolve(__dirname, 'pages/original.html'),
        ss: resolve(__dirname, 'pages/ss.html'),
        uglyGridBackground: resolve(__dirname, 'pages/ugly-grid-background.html')
      }
    }
  }
});
