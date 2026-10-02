import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { STATUSES } from '@config/statuses';

import { applyLanguage } from '@i18n';
import { languages, resources } from '@i18n/config';

import StatusPage from './StatusPage.vue';

const last = languages.at(-1)?.id ?? 'en';

describe('StatusPage', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('announces the status under its code, with a way home and nothing to retry', () => {
    const page = mount(StatusPage, { props: STATUSES.notFound });

    const actual = page
      .find('h1')
      .text();
    expect(actual).toBe('404');

    const actual2 = page
      .find('[role="alert"]')
      .text();
    expect(actual2).toBe('Page not found');

    const actual3 = page
      .find('a')
      .attributes('href');
    expect(actual3).toBe('/');

    const actual4 = page
      .find('button')
      .exists();
    expect(actual4).toBe(false);
  });

  it('offers a retry when it is given one', async () => {
    const onRetry = vi.fn();
    const page = mount(StatusPage, { props: {
      ...STATUSES.serverError,
      onRetry,
    } });

    await page
      .find('button')
      .trigger('click');

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('speaks the language chosen', async () => {
    const page = mount(StatusPage, { props: STATUSES.forbidden });

    applyLanguage(last);
    await nextTick();

    const message = page
      .find('[role="alert"]')
      .text();

    expect(message).toBe(resources[last].common.statusForbidden);
  });
});
