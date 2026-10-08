import { mount } from '@vue/test-utils';

import { mockNuxtImport } from '@nuxt/test-utils/runtime';

import { STATUSES } from '@config/statuses';

import ErrorPage from './error.vue';

import type { NuxtError } from 'nuxt/app';

const { clearError } = vi.hoisted(() => {
  const mocks = { clearError: vi.fn() };

  return mocks;
});

mockNuxtImport('clearError', () => {
  return clearError;
});

const global = { stubs: { AppHeader: true } };

const errorOf = (status: number): Pick<NuxtError, 'status'> => {
  const error = { status };

  return error;
};

describe('the error page', () => {
  it.each([STATUSES.forbidden, STATUSES.notFound])('shows the $code page under the header, with nothing to retry', ({
    code,
    message,
  }) => {
    const page = mount(ErrorPage, {
      props: { error: errorOf(code) },
      global,
    });

    const actual = page
      .find('h1')
      .text();
    expect(actual).toBe(String(code));

    const actual2 = page
      .find('[role="alert"]')
      .text();
    expect(actual2).toBe(message);

    const actual3 = page
      .find('app-header-stub')
      .exists();
    expect(actual3).toBe(true);

    const actual4 = page
      .find('button')
      .exists();
    expect(actual4).toBe(false);
  });

  it('shows the 500 page for a crash, and clears the error on retry', async () => {
    const page = mount(ErrorPage, {
      props: { error: errorOf(500) },
      global,
    });

    const actual = page
      .find('h1')
      .text();
    expect(actual).toBe('500');

    await page
      .find('button')
      .trigger('click');

    expect(clearError).toHaveBeenCalledOnce();
  });
});
