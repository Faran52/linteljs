import { targetFor } from '../targets';

import { ANSWERS, DEFAULT_ANSWERS } from './registry';

import type { TargetRecord } from '../targets/types';
import type { TargetId } from './target/target/targetAnswer';

const recordFor = (target: TargetId): TargetRecord => {
  return targetFor({
    ...DEFAULT_ANSWERS,
    target,
  });
};

describe('slot', () => {
  it('gates browser, surfaces and browsers on hostsBrowser', () => {
    const webextension = recordFor('webextension');
    const react = recordFor('react');

    expect(ANSWERS.browser.slot(webextension)).toBe(true);
    expect(ANSWERS.browser.slot(react)).toBe(false);
    expect(ANSWERS.surfaces.slot(webextension)).toBe(true);
    expect(ANSWERS.surfaces.slot(react)).toBe(false);
    expect(ANSWERS.browsers.slot(webextension)).toBe(true);
    expect(ANSWERS.browsers.slot(react)).toBe(false);
  });

  it('gates hostedFramework on hostsFramework', () => {
    const astro = recordFor('astro');
    const react = recordFor('react');

    expect(ANSWERS.hostedFramework.slot(astro)).toBe(true);
    expect(ANSWERS.hostedFramework.slot(react)).toBe(false);
  });

  it('gates router on a target with a routers slot', () => {
    const react = recordFor('react');
    const vue = recordFor('vue');

    expect(ANSWERS.router.slot(react)).toBe(true);
    expect(ANSWERS.router.slot(vue)).toBe(false);
  });

  it('gates store on a target with a store slot', () => {
    const react = recordFor('react');
    const svelte = recordFor('svelte');

    expect(ANSWERS.store.slot(react)).toBe(true);
    expect(ANSWERS.store.slot(svelte)).toBe(false);
  });
});

describe('only', () => {
  it('offers both routers where the target lists them', () => {
    const react = recordFor('react');

    expect(ANSWERS.router.values['react-router'].only(react)).toBe(true);
    expect(ANSWERS.router.values['tanstack-router'].only(react)).toBe(true);
  });

  it('offers neither router where the target has no routers slot', () => {
    const vue = recordFor('vue');

    expect(ANSWERS.router.values['react-router'].only(vue)).toBe(false);
    expect(ANSWERS.router.values['tanstack-router'].only(vue)).toBe(false);
  });

  it('offers react-hook-form only where the target renders with React', () => {
    const react = recordFor('react');
    const vue = recordFor('vue');

    expect(ANSWERS.form.values['react-hook-form'].only(react)).toBe(true);
    expect(ANSWERS.form.values['react-hook-form'].only(vue)).toBe(false);
  });
});

describe('askedWhen', () => {
  it('asks plugins only after a non-empty agents', () => {
    expect(ANSWERS.plugins.askedWhen({
      ...DEFAULT_ANSWERS,
      agents: ['claude-code'],
    })).toBe(true);
    expect(ANSWERS.plugins.askedWhen({
      ...DEFAULT_ANSWERS,
      agents: [],
    })).toBe(false);
  });
});
