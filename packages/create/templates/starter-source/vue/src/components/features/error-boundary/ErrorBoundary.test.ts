import {
  defineComponent,
  h,
  nextTick,
} from 'vue';
import { mount } from '@vue/test-utils';

import { ForbiddenError } from '../../../lib/utils/statusUtils';

import ErrorBoundary from './ErrorBoundary.vue';

const failure = {
  armed: true,
  error: new Error('render failed'),
};

const Flaky = defineComponent(() => {
  return () => {
    if (failure.armed) {
      throw failure.error;
    }

    return h('p', 'Rendered');
  };
});

const slots = { default: () => {
  return h(Flaky);
} };

describe('ErrorBoundary', () => {
  beforeEach(() => {
    failure.armed = true;
    failure.error = new Error('render failed');
    // The boundary reports what it caught, which is the case under test.
    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);
  });

  it('shows the 500 page in place of a child that throws', async () => {
    const boundary = mount(ErrorBoundary, { slots });

    await nextTick();

    expect(boundary
      .find('h1')
      .text()).toBe('500');
    expect(boundary
      .find('[role="alert"]')
      .text()).toBe('Something went wrong');
  });

  it('shows the 403 page, with no retry, for a child that throws a ForbiddenError', async () => {
    failure.error = new ForbiddenError();
    const boundary = mount(ErrorBoundary, { slots });

    await nextTick();

    expect(boundary
      .find('h1')
      .text()).toBe('403');
    expect(boundary
      .find('button')
      .exists()).toBe(false);
  });

  it('renders the child again on retry', async () => {
    const boundary = mount(ErrorBoundary, { slots });

    await nextTick();
    failure.armed = false;
    await boundary
      .find('button')
      .trigger('click');

    expect(boundary.text()).toContain('Rendered');
  });
});
