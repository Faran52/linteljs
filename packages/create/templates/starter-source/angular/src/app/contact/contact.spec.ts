import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { Contact } from './contact';

const render = async (): Promise<ComponentFixture<Contact>> => {
  const harness = TestBed.createComponent(Contact);

  await harness.whenStable();

  return harness;
};

// A macrotask first: TanStack Form settles a submit on a promise the fixture does not track.
const settle = async (harness: ComponentFixture<Contact>): Promise<HTMLElement> => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

  await harness.whenStable();

  return harness.nativeElement as HTMLElement;
};

const fill = async (harness: ComponentFixture<Contact>, selector: string, value: string): Promise<HTMLElement> => {
  const field = (harness.nativeElement as HTMLElement).querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);

  if (field === null) {
    throw new Error(`No field matches ${selector}`);
  }

  field.value = value;
  field.dispatchEvent(new Event('input'));
  field.dispatchEvent(new Event('blur'));

  return await settle(harness);
};

const submit = async (harness: ComponentFixture<Contact>): Promise<HTMLElement> => {
  (harness.nativeElement as HTMLElement)
    .querySelector('form')
    ?.dispatchEvent(new Event('submit'));

  return await settle(harness);
};

describe('Contact', () => {
  it('refuses what the rules refuse, and says why beside the field', async () => {
    const harness = await render();
    const root = await fill(harness, '#email', 'not-an-address');

    const message = root.querySelector('#email-error')?.textContent;

    expect(message).toBe('Enter a valid email address.');
  });

  it('flags only the field that was left', async () => {
    const harness = await render();
    const root = await fill(harness, '#email', 'not-an-address');

    const untouched = root.querySelector('#message-error');

    expect(untouched).toBeNull();
  });

  it('clears an error as soon as the value is valid', async () => {
    const harness = await render();
    const root = await fill(harness, '#email', 'not-an-address');
    const field = root.querySelector<HTMLInputElement>('#email');

    if (field === null) {
      throw new Error('No email field');
    }

    field.value = 'someone@example.com';
    field.dispatchEvent(new Event('input'));
    await settle(harness);

    const stale = root.querySelector('#email-error');

    expect(stale).toBeNull();
  });

  it('keeps Send open while a field is still to fill', async () => {
    const harness = await render();
    const root = await fill(harness, '#email', 'someone@example.com');

    const disabled = root.querySelector('button')?.disabled;

    expect(disabled).toBe(false);
  });

  it('sends once both fields are valid', async () => {
    const harness = await render();

    await fill(harness, '#email', 'someone@example.com');
    await fill(harness, '#message', 'Ten characters, at least.');

    const root = await submit(harness);
    const confirmed = root.querySelector('[role="status"]');

    expect(confirmed).not.toBeNull();
  });

  it('holds back an empty form and marks both fields', async () => {
    const harness = await render();
    const root = await submit(harness);

    const errors = root.querySelectorAll('.error');

    expect(errors).toHaveLength(2);
    expect(root.querySelector('[role="status"]')).toBeNull();
  });
});
