import { mount } from '@vue/test-utils';

import { STATUSES } from '@config/statuses';

import StatusPage from './StatusPage.vue';

describe('StatusPage', () => {
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
});
