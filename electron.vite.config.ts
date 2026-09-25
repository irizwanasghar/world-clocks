import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/main.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/preload.ts')
        }
      }
    }
  },
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: {
          clock: resolve(__dirname, 'src/clock.html'),
          settings: resolve(__dirname, 'src/settings.html'),
          states: resolve(__dirname, 'src/states.html'),
          statesButton: resolve(__dirname, 'src/statesButton.html'),
          masterSettings: resolve(__dirname, 'src/masterSettings.html'),
          masterModal: resolve(__dirname, 'src/masterModal.html'),
          populationButton: resolve(__dirname, 'src/populationButton.html'),
          population: resolve(__dirname, 'src/population.html')
        }
      }
    },
    plugins: [react()]
  }
})
