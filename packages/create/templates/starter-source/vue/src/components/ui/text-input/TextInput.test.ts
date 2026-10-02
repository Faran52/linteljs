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

    const labelled = field
      .get('label')
      .attributes('for');

    expect(labelled).toBe('email');
    const actual = input.attributes('type');
    expect(actual).toBe('email');
    const actual2 = input.attributes('aria-invalid');
    expect(actual2).toBe('false');

    await input.setValue('someone@example.com');

    const actual3 = field.emitted('change');
    const expected = [['someone@example.com']];
    expect(actual3).toEqual(expected);
  });

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

    const actual = area.attributes('aria-describedby');
    expect(actual).toBe('message-error');
    const message = field
      .get('#message-error')
      .text();

    expect(message).toBe('Write at least ten characters.');

    await area.setValue('long enough now');
    await area.trigger('blur');

    const actual2 = field.emitted('change');
    const expected = [['long enough now']];
    expect(actual2).toEqual(expected);
    const actual3 = field.emitted('blur');
    const expected2 = [[]];
    expect(actual3).toEqual(expected2);
  });
});
