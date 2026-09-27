import { mount } from '@vue/test-utils';

import AppButton from './AppButton.vue';

describe('AppButton', () => {
  it('answers the press and carries what it was given', () => {
    const button = mount(AppButton, { slots: { default: 'Add one' } });

    expect(button.text()).toBe('Add one');
    expect(button.attributes('type')).toBe('button');
  });

  it('submits a form when it is asked to, and is inert while disabled', () => {
    const button = mount(AppButton, {
      props: {
        type: 'submit',
        disabled: true,
      },
      slots: { default: 'Send' },
    });

    expect(button.attributes('type')).toBe('submit');
    expect(button.attributes('disabled')).toBeDefined();
  });
});
