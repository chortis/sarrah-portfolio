import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

/**
 * Read .env.desktop (if present) and produce a `define` map that inlines the
 * BAKED_* credentials into the main process bundle at build time. This is how
 * credentials get "baked in" so the packaged app never needs sign-in.
 */
function bakedDefines(): Record<string, string> {
  const file = resolve(__dirname, '.env.desktop')
  const defines: Record<string, string> = {}
  if (!existsSync(file)) return defines
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!key.startsWith('BAKED_')) continue
    defines[`process.env.${key}`] = JSON.stringify(value)
  }
  return defines
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: bakedDefines(),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
