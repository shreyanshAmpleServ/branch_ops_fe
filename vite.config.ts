// // import { defineConfig } from 'vite'
// // import react from '@vitejs/plugin-react'

// // // https://vite.dev/config/
// // export default defineConfig({
// //   plugins: [react()],
// // })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import reactInspector from 'vite-plugin-react-inspector'

export default defineConfig({
  plugins: [
    react(),
    reactInspector()
  ],
})