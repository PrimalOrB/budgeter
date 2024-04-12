import { defineConfig, loadEnv  } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      'process.env': env,
    }, 
    server: {
      port: 3000,
      proxy: {
        "/graphql": {
          target: "http://localhost:3001/graphql",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      }
    },
  }
})
