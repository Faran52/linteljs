import { mount } from '@vue/test-utils';
import { clearError, type NuxtError } from 'nuxt/app';

import { STATUSES } from './config/statuses';
import ErrorPage from './error.vue';

vi.mock('nuxt/app', () => {
  return { clearError: vi.fn() };
});

const global = { stubs: { AppHeader: true } };

const errorOf = (status: number): Pick<NuxtError, 'status'> => {
  return { status };
};

describe('the error page', () => {
  beforeEach(() => {
    vi.mocked(clearError)
      .mockClear();
  });

  it.each([STATUSES.forbidden, STATUSES.notFound])('shows the $code page under the header, with nothing to retry', ({
    code,
    message,
  }) => {
    const page = mount(ErrorPage, {
      props: { error: errorOf(code) },
      global,
    });

    expect(page
      .find('h1')
      .text()).toBe(String(code));

    expect(page
      .find('[role="alert"]')
      .text()).toBe(message);

    expect(page
      .find('app-header-stub')
      .exists()).toBe(true);

    expect(page
      .find('button')
      .exists()).toBe(false);
  });

  it('shows the 500 page for a crash, and clears the error on retry', async () => {
    const page = mount(ErrorPage, {
      props: { error: errorOf(500) },
      global,
    });

    expect(page
      .find('h1')
      .text()).toBe('500');

    await page
      .find('button')
      .trigger('click');

    expect(clearError).toHaveBeenCalledOnce();
  });
});
