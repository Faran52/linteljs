import { TestBed } from '@angular/core/testing';

import { STATUSES } from '@config/statuses';

import { applyLanguage } from '@i18n';
import { languages, resources } from '@i18n/config';

import { StatusPage } from './status-page';

const last = languages.at(-1)?.id ?? 'en';

const open = async (retry?: () => void): Promise<HTMLElement> => {
  const harness = TestBed.createComponent(StatusPage);

  harness.componentRef.setInput('code', STATUSES.serverError.code);
  harness.componentRef.setInput('message', STATUSES.serverError.message);
  harness.componentRef.setInput('onRetry', retry);
  await harness.whenStable();

  return harness.nativeElement as HTMLElement;
};

describe('StatusPage', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('announces the status under its code, with a way home and nothing to retry', async () => {
    const root = await open();

    expect(root.querySelector('h1')?.textContent).toBe('500');
    expect(root.querySelector('[role="alert"]')?.textContent).toBe('Something went wrong');
    const home = root
      .querySelector('a')
      ?.getAttribute('href');

    const retryButton = root.querySelector('button');

    expect(home).toBe('/');
    expect(retryButton).toBeNull();
  });

  it('offers a retry when it is given one', async () => {
    const retry = vi.fn();
    const root = await open(retry);

    root
      .querySelector('button')
      ?.click();

    expect(retry).toHaveBeenCalledOnce();
  });

  it('says it all in the language applied', async () => {
    applyLanguage(last);

    const root = await open(vi.fn());
    const { common } = resources[last];
    const retryLabel = root.querySelector('button')?.textContent;

    expect(root.querySelector('[role="alert"]')?.textContent).toBe(common.statusServerError);
    expect(retryLabel?.trim()).toBe(common.statusRetry);
    expect(root.querySelector('a')?.textContent).toBe(common.statusHome);
  });
});
