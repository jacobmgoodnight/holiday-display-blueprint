import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins:[react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/holiday-display-blueprint/' : '/',
  test:{environment:'jsdom',include:['src/tests/**/*.test.ts']}
});
