import { provideLocationMocks } from '@angular/common/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  withComponentInputBinding,
} from '@angular/router';

import {
  ANSWERS,
  GATE,
  NAME,
} from '@config/linteljs';
import { PAGES } from '@config/routes';

import { CrashHandler } from '@lib/providers/crash-handler/crash-handler';
import { ForbiddenError } from '@utils/status-utils';

import { App } from './app';
import { routes } from './app.routes';

const open = async (path: string): Promise<HTMLElement> => {
  const routing = provideRouter(routes, withComponentInputBinding());

  TestBed.configureTestingModule({
    imports: [App],
    providers: [routing, provideLocationMocks()],
  });

  const harness = TestBed.createComponent(App);

  await TestBed.inject(Router).navigateByUrl(path);
  await harness.whenStable();

  return harness.nativeElement as HTMLElement;
};

describe('App', () => {
  it('names the project and links every page the route list names', async () => {
    const root = await open('/');

    expect(root.querySelector('.starter-label')?.textContent).toBe('LintelJS Starter');
    expect(root.querySelector('.brand')?.textContent).toContain(NAME);

    const tabs = root.querySelectorAll('nav .tab');

    expect(tabs).toHaveLength(PAGES.length);
  });

  it('opens on the home page, mark and all', async () => {
    const root = await open('/');
    const mark = root.querySelector('.mark');

    expect(mark).not.toBeNull();
    expect(root.querySelector('.title')?.textContent).toContain(NAME);
  });

  it('routes to the about page', async () => {
    const root = await open('/about');

    expect(root.querySelector('.page-title')?.textContent).toContain('About');

    for (const { command } of GATE) {
      expect(root.textContent).toContain(command);
    }
  });

  it('routes to the version page, which renders what was recorded', async () => {
    const root = await open('/version');

    expect(root.querySelector('.page-title')?.textContent).toContain('Version');
    expect(root.querySelectorAll('dt').length).toBeGreaterThanOrEqual(ANSWERS.length);
  });

  it('shows the 404 page, under the header, for a path no route matches', async () => {
    const root = await open('/missing');

    const starterLabel = root.querySelector('.starter-label');

    expect(root.querySelector('h1')?.textContent).toBe('404');
    expect(starterLabel).not.toBeNull();
  });

  it('swaps the page for the 500 page on a crash, and brings it back on retry', async () => {
    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);

    const root = await open('/');
    const settled = TestBed.inject(ApplicationRef);

    TestBed.inject(CrashHandler)
      .handleError(new Error('render failed'));

    await settled.whenStable();

    const crashedMark = root.querySelector('.mark');

    expect(root.querySelector('h1')?.textContent).toBe('500');
    expect(crashedMark).toBeNull();

    root
      .querySelector('button')
      ?.click();

    await settled.whenStable();

    const retriedMark = root.querySelector('.mark');

    expect(retriedMark).not.toBeNull();
  });

  it('swaps the page for the 403 page, with no retry, on a ForbiddenError', async () => {
    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);

    const root = await open('/');
    const settled = TestBed.inject(ApplicationRef);

    TestBed.inject(CrashHandler)
      .handleError(new ForbiddenError());

    await settled.whenStable();

    const retryButton = root.querySelector('button');

    expect(root.querySelector('h1')?.textContent).toBe('403');
    expect(retryButton).toBeNull();
  });
});
