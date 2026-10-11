// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import { ANSWERS, STACK } from '@config/linteljs';

import { t } from '@i18n/i18n';

import VersionView from './VersionView.astro';

describe('VersionView', () => {
  it('lists every package in the stack with its version', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(VersionView);

    for (const { name, version } of STACK) {
      expect(html).toContain(name);
      expect(html).toContain(version);
    }
  });

  it('lists every answer the project was generated from, each label marked for the client to translate', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(VersionView);

    for (const { label, value } of ANSWERS) {
      expect(html).toContain(`data-i18n="${label}"`);
      expect(html).toContain(`>${t(label)}<`);
      expect(html).toContain(value);
    }
  });
});
