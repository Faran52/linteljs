import {
  describe,
  expect,
  it,
} from 'vitest';

interface VersionResponse {
  readonly status: string;
}

describe('handlers', () => {
  it('answers the version endpoint', async () => {
    const response = await fetch('/api/version');

    expect(response.ok).toBe(true);
    const actual = await response.json() as Promise<VersionResponse>;
    const expected = { status: 'ok' };
    expect(actual).toEqual(expected);
  });

  it('refuses a path no handler answers, rather than reaching the network', async () => {
    const promise = fetch('/api/nothing-here');
    await expect(promise).rejects.toThrow();
  });
});
