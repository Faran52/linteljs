import { rmSync } from 'node:fs';

rmSync('.e2e', {
  recursive: true,
  force: true,
});
