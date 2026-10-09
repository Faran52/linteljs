import {
  frameworkRuleIdsFor,
  ruleIdsFor,
  startsWith,
} from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base/baseLayer';

import playwright from './playwrightLayer';

import type { Layer } from '../../types';

const FOCUSED = "import { expect, test } from '@playwright/test';\n\n"
  + "test.only('opens', async ({ page }) => {\n  await expect(page).toHaveTitle('Home');\n});\n";

const CLEAN = "import { expect, test } from '@playwright/test';\n\n"
  + "test('opens', async ({ page }) => {\n  await expect(page).toHaveTitle('Home');\n});\n";

describe('playwright', () => {
  const layer = (): Layer => {
    const built = [...base(), ...playwright()];

    return built;
  };

  it('reports a focused test beside a flow component', async () => {
    const ruleIds = await ruleIdsFor(layer(), FOCUSED, 'src/flows/checkout/checkout.e2e.ts');
    expect(ruleIds).toContain('playwright/no-focused-test');
  });

  it('reports a focused test under e2e/', async () => {
    const ruleIds = await ruleIdsFor(layer(), FOCUSED, 'e2e/home/home.ts');
    expect(ruleIds).toContain('playwright/no-focused-test');
  });

  it('passes a clean spec', async () => {
    const ruleIds = await ruleIdsFor(layer(), CLEAN, 'src/flows/checkout/checkout.e2e.ts');
    const reported = ruleIds.filter(startsWith('playwright/'));
    expect(reported).toStrictEqual([]);
  });

  it('leaves a unit suite alone', async () => {
    const ruleIds = await ruleIdsFor(layer(), FOCUSED, 'src/lib/utils/sample.test.ts');
    expect(ruleIds).not.toContain('playwright/no-focused-test');
  });

  it('enables no framework rule on a spec', async () => {
    const leaked = await frameworkRuleIdsFor(layer(), 'src/flows/checkout/checkout.e2e.ts');

    expect(leaked).toStrictEqual([]);
  });

  it('names flat/recommended when eslint-plugin-playwright stops publishing it', async () => {
    const stripped = await layerWithoutConfig('eslint-plugin-playwright', 'flat/recommended', async () => {
      const playwrightLayer = await import('./playwrightLayer');
      return playwrightLayer.playwright;
    });

    expect(stripped).toThrow('playwright/flat/recommended is not published');
  });
});
