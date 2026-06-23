// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-oxc'; // ← ここを新しいプラグインに変更

export default defineConfig({
  plugins: [react()],
});