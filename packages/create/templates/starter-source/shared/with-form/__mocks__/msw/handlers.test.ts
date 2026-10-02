import {
  describe,
  expect,
  it,
} from 'vitest';

interface VersionResponse {
  readonly status: string;
}

interface ContactResponse {
  readonly status: string;
}

const postContact = async (body: object): Promise<Response> => {
  return await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

describe('handlers', () => {
  it('answers the version endpoint', async () => {
    const response = await fetch('/api/version');

    const actual = await response.json() as Promise<VersionResponse>;
    const expected = { status: 'ok' };
    expect(actual).toEqual(expected);
  });

  it('accepts contact details that pass validation', async () => {
    const response = await postContact({ email: 'someone@example.com', message: 'Ten characters at least.' });

    expect(response.status).toBe(202);
    const actual = await response.json() as Promise<ContactResponse>;
    const expected = { status: 'accepted' };
    expect(actual).toEqual(expected);
  });

  it('refuses contact details that do not, with the status a server would send', async () => {
    const response = await postContact({ email: 'nope', message: 'short' });

    expect(response.status).toBe(422);
  });
});
