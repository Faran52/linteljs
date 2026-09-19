import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { casesFor } from '../matrix/matrix';
import { runE2eCase } from '../runner/runner';
import { afterAllCleanup } from '../utils/workspaceUtils';

describe('webextension end-to-end', () => {
  afterAll(afterAllCleanup);

  it.concurrent.each(casesFor('webextension'))('generates, installs and checks $label', runE2eCase, 900_000);
});
