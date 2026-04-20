import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      // Force Vite to use the UMD/CJS build which has a proper default export
      phaser: path.resolve(__dirname, 'node_modules/phaser/dist/phaser.js'),
    },
  },
  build: {
    assetsInlineLimit: 0,
  },
})
