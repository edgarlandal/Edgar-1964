import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const apiUrl = (
  process.env.API_URL ?? 'http://127.0.0.1:3001'
).replace(/\/$/, '')


const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), nitro({
    routeRules: { '/api/**': { proxy:  `${apiUrl}/api/**`} },
  }), tailwindcss(), tanstackStart(), viteReact()],
})

export default config
