import { defineConfig, loadEnv  } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Only REACT_APP_* values (from .env files or the build environment) reach
  // the browser, each replaced individually. Defining the whole process.env
  // would bake every variable on the build machine into the bundle.
  const env = loadEnv(mode, process.cwd(), 'REACT_APP_')
  const define = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
  )
  return {
    plugins: [react()],
    define,
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
