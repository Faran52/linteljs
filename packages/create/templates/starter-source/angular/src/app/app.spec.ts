import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { ANSWERS, NAME } from '../config/linteljs';
import { PAGES } from '../config/routes';

import { App } from './app';
import { routes } from './app.routes';

const open = async (path: string): Promise<HTMLElement> => {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [provideRouter(routes), provideLocationMocks()],
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
    expect(root.querySelectorAll('.tab')).toHaveLength(PAGES.length);
  });

  it('opens on the home page, mark and all', async () => {
    const root = await open('/');

    expect(root.querySelector('.mark')).not.toBeNull();
    expect(root.querySelector('.title')?.textContent).toContain(NAME);
  });

  it('routes to the about page', async () => {
    const root = await open('/about');

    expect(root.querySelector('.page-title')?.textContent).toContain('About');
    expect(root.textContent).toContain('pnpm typecheck');
  });

  it('routes to the version page, which renders what was recorded', async () => {
    const root = await open('/version');

    expect(root.querySelector('.page-title')?.textContent).toContain('Version');
    expect(root.querySelectorAll('dt').length).toBeGreaterThanOrEqual(ANSWERS.length);
  });
});
