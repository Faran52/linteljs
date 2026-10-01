import { createRawSnippet } from 'svelte';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import Button from './Button.svelte';

const label = (text: string): ReturnType<typeof createRawSnippet> => {
  return createRawSnippet(() => {
    return {
      render: () => {
        return `<span>${text}</span>`;
      },
    };
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

    expect(pressed).toEqual(['add']);
  });

  it('submits a form when it is asked to, and is inert while disabled', () => {
    render(Button, {
      children: label('Send'),
      type: 'submit',
      disabled: true,
    });

    const button = screen.getByRole('button', { name: 'Send' });

    expect(button.getAttribute('type')).toBe('submit');
    expect(button.hasAttribute('disabled')).toBe(true);
  });
});
