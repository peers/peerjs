// PLEASE DO NO COPY THIS FILE INTO YOUR PROJECT IF YOU ARE USING VITE AS WELL
// Custom to example
import path from 'path';
export default {
  
  resolve: {
    alias: {
      'peerjs': path.resolve(__dirname, '../lib/exports'),
    },
  },
}