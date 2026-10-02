import { createRawSnippet } from 'svelte';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import Button from './Button.svelte';

const label = (text: string): ReturnType<typeof createRawSnippet> => {
  return createRawSnippet(() => {
    const snippet = {
      render: () => {
        return `<span>${text}</span>`;
      },
    };

    return snippet;
  });
};

describe('Button', () => {
  it('answers the press', async () => {
    const pressed: string[] = [];

    render(Button, {
      children: label('Add one'),
      onclick: () => {
        pressed.push('add');
      },
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    const expected = ['add'];
    expect(pressed).toEqual(expected);
  });

  it('submits a form when it is asked to, and is inert while disabled', () => {
    render(Button, {
      children: label('Send'),
      type: 'submit',
      disabled: true,
    });

    const button = screen.getByRole('button', { name: 'Send' });

    const attribute = button.getAttribute('type');
    expect(attribute).toBe('submit');
    const disabledHasAttribute = button.hasAttribute('disabled');
    expect(disabledHasAttribute).toBe(true);
  });
});
