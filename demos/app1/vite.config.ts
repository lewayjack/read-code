import vue from '@vitejs/plugin-vue';
import { defineConfig, normalizePath } from 'vite';
import cesium from 'vite-plugin-cesium';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    cesium(),
    // 运行和构建时copy
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(path.resolve(__dirname, '../../node_modules/earthsdk3-assets')),
          dest: './js'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@sdkSrc': normalizePath(path.resolve(__dirname, '../../earthsdk/earthsdk3/src')),
      '@czmSrc': normalizePath(path.resolve(__dirname, '../../earthsdk/earthsdk3-cesium/src')),
      '@ueSrc': normalizePath(path.resolve(__dirname, '../../earthsdk/earthsdk3-ue/src')),
    }
  }
})

