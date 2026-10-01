import { CHECK, NAME } from '@config/linteljs';

import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';

import { renderPopup } from './renderPopup';

const last = languages.at(-1)?.id ?? 'en';

const open = (): HTMLElement => {
  const root = document.createElement('div');

  renderPopup(root);

  return root;
};

const pickerOf = (root: HTMLElement): HTMLSelectElement => {
  const picker = root.querySelector('select');

  if (picker === null) {
    throw new TypeError('The popup has no language select');
  }

  return picker;
};

describe('renderPopup', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('carries the project name and the mark', () => {
    const root = open();

    expect(root.querySelector('h1')?.textContent).toBe(NAME);
    expect(root.querySelector('svg[role="img"]')).not.toBeNull();
    expect(root.className).toBe('hero');
  });

  it('points at the gate, as every home page does', () => {
    const root = open();

    const hint = root.querySelector('.hint')?.textContent;
    const command = root.querySelector('.hint code')?.textContent;

    const expected = `Run ${CHECK} for the full gate.`;

    expect(hint).toBe(expected);
    expect(command).toBe(CHECK);
    expect(root.querySelector('button')).toBeNull();
  });

  it('offers every language, each named in itself', () => {
    const options = [...pickerOf(open()).options]
      .map((option) => {
        return [
          option.value,
          option.lang,
          option.textContent,
        ];
      });

    const expected = languages
      .map(({ id, label }) => {
        return [
          id,
          id,
          label,
        ];
      });

    expect(options).toEqual(expected);
  });

  it('opens in the stored language, with its direction, and shows it in the select', () => {
    localStorage.setItem(languageStorageKey, last);

    const picker = pickerOf(open());

    expect(picker.value).toBe(last);
    expect(document.documentElement.lang).toBe(last);
    expect(document.documentElement.dir).toBe(languages.at(-1)?.dir);
    expect(picker.getAttribute('aria-label')).toBe(resources[last].common.language);
  });

  it('stores a choice and renders the popup in it', () => {
    const root = open();
    const picker = pickerOf(root);
    const english = root.querySelector('.lede')?.textContent;
    const englishHint = root.querySelector('.hint')?.textContent;

    picker.value = last;
    picker.dispatchEvent(new Event('change'));

    const lede = root.querySelector('.lede')?.textContent;
    const hint = root.querySelector('.hint')?.textContent;

    expect(localStorage.getItem(languageStorageKey)).toBe(last);
    expect(document.documentElement.lang).toBe(last);
    expect(root.querySelector('.hint code')?.textContent).toBe(CHECK);
    expect(lede === english).toBe(last === 'en');
    expect(hint === englishHint).toBe(last === 'en');
  });
});
