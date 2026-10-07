import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PAGES } from '@config/routes';

import { AppHeader } from './app-header';

describe('AppHeader', () => {
  it('names the project and links every page on the one route list', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideLocationMocks()] });

    const harness = TestBed.createComponent(AppHeader);

    harness.componentRef.setInput('name', 'my-app');
    await harness.whenStable();

    const root = harness.nativeElement as HTMLElement;
    const brand = root.querySelector('.brand')?.textContent;
    const links = [...root.querySelectorAll('nav a')]
      .map((tab) => {
        const link = {
          href: tab.getAttribute('href'),
          label: tab.textContent.trim(),
        };

        return link;
      });
    const expected = PAGES
      .map((page) => {
        const link = {
          href: page.path,
          label: page.label,
        };

        return link;
      });

    expect(brand).toBe('my-app');
    expect(links).toEqual(expected);
  });
});
