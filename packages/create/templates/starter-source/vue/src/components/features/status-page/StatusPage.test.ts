import { mount } from '@vue/test-utils';

import { STATUSES } from '@config/statuses';

import StatusPage from './StatusPage.vue';

describe('StatusPage', () => {
  it('announces the status under its code, with a way home and nothing to retry', () => {
    const page = mount(StatusPage, { props: STATUSES.notFound });

    expect(page
      .find('h1')
      .text()).toBe('404');
    expect(page
      .find('[role="alert"]')
      .text()).toBe('Page not found');
    expect(page
      .find('a')
      .attributes('href')).toBe('/');
    expect(page
      .find('button')
      .exists()).toBe(false);
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
