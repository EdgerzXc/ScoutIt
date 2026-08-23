import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Next treats this as a compile-time poison pill. Vitest needs an inert
      // replacement so server-only modules can be exercised in isolation.
      'server-only': path.resolve(__dirname, './src/lib/__tests__/serverOnlyFixture.js'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.js'],
  },
});
