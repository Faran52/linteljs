import { TestBed } from '@angular/core/testing';

import { STATUSES } from '@config/statuses';

import { StatusPage } from './status-page';

const open = async (retry?: () => void): Promise<HTMLElement> => {
  const harness = TestBed.createComponent(StatusPage);

  harness.componentRef.setInput('code', STATUSES.serverError.code);
  harness.componentRef.setInput('message', STATUSES.serverError.message);
  harness.componentRef.setInput('onRetry', retry);
  await harness.whenStable();

  return harness.nativeElement as HTMLElement;
};

describe('StatusPage', () => {
  it('announces the status under its code, with a way home and nothing to retry', async () => {
    const root = await open();

    expect(root.querySelector('h1')?.textContent).toBe('500');
    expect(root.querySelector('[role="alert"]')?.textContent).toBe('Something went wrong');
    const home = root
      .querySelector('a')
      ?.getAttribute('href');

    expect(home).toBe('/');
    expect(root.querySelector('button')).toBeNull();
  });

  it('offers a retry when it is given one', async () => {
    const retry = vi.fn();
    const root = await open(retry);

    root
      .querySelector('button')
      ?.click();

    expect(retry).toHaveBeenCalledOnce();
  });
});
