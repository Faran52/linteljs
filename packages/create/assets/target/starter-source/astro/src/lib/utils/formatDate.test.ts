import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats a date for a page to render', () => {
    expect(formatDate(new Date('2026-03-09T00:00:00Z'))).toBe('9 Mar 2026');
  });

  it('takes a locale, so a site is not pinned to one', () => {
    expect(formatDate(new Date('2026-03-09T00:00:00Z'), 'en-US')).toBe('Mar 9, 2026');
  });
});
