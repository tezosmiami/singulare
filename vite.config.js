import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgrPlugin from 'vite-plugin-svgr'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'
import filterReplace from 'vite-plugin-filter-replace'

export default defineConfig({
    plugins: [
      filterReplace(
        [
          {
            filter: 'node_modules/@airgap/beacon-ui/dist/esm/utils/qr.js',
            replace: {
              from: "import * as qrcode from 'qrcode-generator';",
              to: "import qrcode from 'qrcode-generator';",
            },
          },
          {
            filter: [
              'node_modules/@airgap/beacon-dapp/dist/walletbeacon.dapp.min.js',
              'node_modules/@airgap/beacon-ui/dist/cjs/ui/alert/alert-templates.js',
              'node_modules/@airgap/beacon-ui/dist/esm/ui/alert/alert-templates.js',
            ],
            replace: {
              from: /\\n@media\s*\(min-height:\s*700px\).*translateY\(-50%\);\\n\s*\}\\n\}/g,
              to: '',
            },
          },
        ],
        {
          apply: 'build',
          enforce: 'post',
        }
      ),
      react(),
      svgrPlugin(),
    ],
    server: {
      host: true,
      port: 3000,
    },
    build: {
      outDir: 'build',
      rollupOptions: {
        plugins: [rollupNodePolyFill()],
        output: {
          manualChunks: {
            taquito: [
              '@taquito/taquito'
            ],
            beacon: [
              '@taquito/beacon-wallet'
            ],
            ui: [
              'react',
              'react-router-dom',
              'react-dom'
            ],
          },
        },
      },
    },
    optimizeDeps: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      esbuildOptions: {
        inject: ['./src/node_polyfill.js'],
      },
    },
    resolve: {
      alias: {
        'readable-stream': 'vite-compatible-readable-stream',
        stream: 'vite-compatible-readable-stream',
        fs: "rollup-plugin-node-polyfills/polyfills/empty",
        util: 'rollup-plugin-node-polyfills/polyfills/util',
        buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
        process: 'rollup-plugin-node-polyfills/polyfills/process-es6'
        
      },
    },
  }) 