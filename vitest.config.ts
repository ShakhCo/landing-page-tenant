import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Logic and server code run on node so the suite stays fast; a component
    // test opts into the DOM with a `// @vitest-environment jsdom` docblock at
    // the top of its own file.
    environment: 'node',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', '.open-next/**'],
    setupFiles: ['lib/test/setup.ts'],
    env: {
      NEW_API_ORIGIN: 'https://api.test.local',
    },
  },
});
