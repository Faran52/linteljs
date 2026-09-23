import { mount } from '@vue/test-utils';

import TextInput from './TextInput.vue';

describe('TextInput', () => {
  it('binds a visible label to the control and answers with what was typed', async () => {
    const field = mount(TextInput, {
      props: {
        id: 'email',
        label: 'Email',
        type: 'email',
        value: '',
        error: undefined,
      },
    });
    const input = field.get('input');

    expect(field.get('label').attributes('for')).toBe('email');
    expect(input.attributes('type')).toBe('email');
    expect(input.attributes('aria-invalid')).toBe('false');

    await input.setValue('someone@example.com');

    expect(field.emitted('change')).toEqual([['someone@example.com']]);
  });

  // `aria-describedby` rather than a paragraph that merely sits nearby: a screen reader reads the error with the
  // field, at the moment it lands on it, rather than after the whole form.
  it('describes a multiline field by its error', async () => {
    const field = mount(TextInput, {
      props: {
        id: 'message',
        label: 'Message',
        multiline: true,
        value: 'hi',
        error: 'Write at least ten characters.',
      },
    });
    const area = field.get('textarea');

    expect(area.attributes('aria-describedby')).toBe('message-error');
    expect(field.get('#message-error').text()).toBe('Write at least ten characters.');

    await area.setValue('long enough now');
    await area.trigger('blur');

    expect(field.emitted('change')).toEqual([['long enough now']]);
    expect(field.emitted('blur')).toEqual([[]]);
  });
});
