import playwrightPlugin from 'eslint-plugin-playwright';

import { E2E_FILES } from '../../config/constants';
import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

// `.e2e.*`, not `.spec.*`, so a unit suite never gets the Playwright rules.
export const playwright = (): Layer => {
  const layer = presetOf(playwrightPlugin.configs['flat/recommended'], 'playwright/flat/recommended', E2E_FILES);

  return layer;
};

export default playwright;
