import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/modules/rag/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      include: [
        'src/modules/rag/services/rag-pipeline.service.ts',
        'src/modules/rag/services/retriever.service.ts',
        'src/modules/ai-agents/utils/agent.utils.ts',
      ],
      reporter: ['text', 'lcov'],
    },
  },
});
