import { mount } from '@vue/test-utils';

import AppButton from './AppButton.vue';

describe('AppButton', () => {
  it('answers the press and carries what it was given', () => {
    const button = mount(AppButton, { slots: { default: 'Add one' } });

    const actual = button.text();
    expect(actual).toBe('Add one');
    const actual2 = button.attributes('type');
    expect(actual2).toBe('button');
  });

  it('submits a form when it is asked to, and is inert while disabled', () => {
    const button = mount(AppButton, {
      props: {
        type: 'submit',
        disabled: true,
      },
      slots: { default: 'Send' },
    });

    const actual = button.attributes('type');
    expect(actual).toBe('submit');
    const actual2 = button.attributes('disabled');
    expect(actual2).toBeDefined();
  });
});
