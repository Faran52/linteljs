import { TestBed } from '@angular/core/testing';

import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { injectExtendedMutation } from './extended-mutation';

interface Accepted {
  readonly status: string;
}

interface Message {
  readonly message: string;
}

const fetchMock = vi.fn();

const answering = (body: Accepted, status = 200): void => {
  fetchMock
    .mockImplementation(() => {
      return Promise.resolve(new Response(JSON.stringify(body), { status }));
    });
};

const freshClient = (): QueryClient => {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
};

const runMutation = (
  path: string,
  client: QueryClient = freshClient(),
  invalidates: readonly string[] = [],
): ReturnType<typeof injectExtendedMutation<Accepted, Message>> => {
  TestBed.configureTestingModule({ providers: [provideTanStackQuery(client)] });

  return TestBed.runInInjectionContext(() => {
    return injectExtendedMutation<Accepted, Message>(path, { invalidates });
  });
};

describe('injectExtendedMutation', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('posts the body and reports success', async () => {
    answering({ status: 'accepted' });

    const mutation = runMutation('/contact');

    await mutation.mutateAsync({ message: 'hello there' });

    expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
      method: 'POST',
      body: '{"message":"hello there"}',
    }));
  });

  it('rejects with the status a server sent', async () => {
    answering({ status: 'no' }, 422);

    const mutation = runMutation('/contact');

    await expect(mutation.mutateAsync({ message: 'no' })).rejects.toMatchObject({ status: 422 });
  });

  it('drops the caches it was told to once the write succeeds', async () => {
    answering({ status: 'accepted' });

    const client = freshClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    await runMutation('/contact', client, ['/version']).mutateAsync({ message: 'hello there' });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['/version'] });
  });
});
