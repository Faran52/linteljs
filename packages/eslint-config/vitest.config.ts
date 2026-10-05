import { statSync } from 'node:fs';

import { defineConfig } from 'vitest/config';
import { BaseSequencer, type TestSpecification } from 'vitest/node';

// Under Stryker a mutant's run bails at its first kill, and the default order (longest first) ran every ESLint suite
// before a small one that alone kills (audit 37241561680 timed out presetUtils.ts:46 that way).
class SmallestFirst extends BaseSequencer {
  override async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    const sorted = files
      .toSorted((a, b) => {
        return statSync(a.moduleId).size - statSync(b.moduleId).size;
      });

    return await Promise.resolve(sorted);
  }
}

const isMutating = process.env['STRYKER_MUTATOR_WORKER'] !== undefined;

// Every case runs a real ESLint; under `--coverage` the 5s default times out on a loaded machine.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    testTimeout: 60000,
    ...(isMutating && { sequence: { sequencer: SmallestFirst } }),
  },
});
