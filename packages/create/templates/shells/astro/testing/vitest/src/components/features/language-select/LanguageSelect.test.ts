// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import { languages } from '@i18n/config';
import { t } from '@i18n/i18n';

import LanguageSelect from './LanguageSelect.astro';

describe('LanguageSelect', () => {
  it('offers every language in its own tongue', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(LanguageSelect);

    for (const option of languages) {
      // Dev builds add source attributes after these.
      expect(html).toContain(`<option value="${option.id}" lang="${option.id}"`);
      expect(html).toContain(`>${option.label}</option>`);
    }
  });

  it('carries the styles it is handed and the mark the client script finds it by', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(LanguageSelect, { props: { class: 'tab' } });

    expect(html).toContain('class="tab"');
    expect(html).toContain(`aria-label="${t('language')}"`);
    expect(html).toContain('data-language');
  });
});
