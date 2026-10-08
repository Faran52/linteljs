import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { ANSWERS, STACK } from '@config/linteljs';

import { languages, resources } from '@i18n/config';
import { applyLanguage } from '@i18n/i18n';

import VersionView from './VersionView.vue';

const last = languages.at(-1)?.id ?? 'en';

describe('VersionView', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('renders every recorded row of the stack', () => {
    const text = mount(VersionView).text();

    for (const { name, version } of STACK) {
      expect(text).toContain(name);
      expect(text).toContain(version);
    }
  });

  it('renders every answer this project was generated from, labelled in the language chosen', async () => {
    const page = mount(VersionView);

    applyLanguage(last);
    await nextTick();

    const { common } = resources[last];
    const labels = page
      .findAll('dt')
      .map((term) => {
        return term.text();
      });

    for (const { label } of ANSWERS) {
      expect(labels).toContain(common[label]);
    }
  });
});
