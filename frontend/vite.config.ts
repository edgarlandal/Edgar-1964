import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ mode }) => {
  const env: { API_URL?: string } = loadEnv(mode, process.cwd(), 'API_')
  const configuredUrl = (process.env.API_URL ?? env.API_URL)?.trim()
  if (process.env.VERCEL && !configuredUrl) {
    throw new Error('Configura API_URL con la URL del backend en Vercel y vuelve a desplegar.')
  }
  const apiUrl = (configuredUrl || 'http://127.0.0.1:3001').replace(/\/$/, '')

  return {
    resolve: { tsconfigPaths: true },
    plugins: [devtools(), nitro({
      routeRules: { '/api/**': { proxy: `${apiUrl}/api/**` } },
    }), tailwindcss(), tanstackStart(), viteReact()],
  }
})

export default config
