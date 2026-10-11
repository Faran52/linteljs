import { stringify } from 'qs';

// `object`: the floor refuses `unknown` bodies, and a second type parameter would pin the body's default.
export type QueryValue = string | number | boolean | readonly string[] | readonly number[];

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly body?: object;
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly signal?: AbortSignal;
}

// `status` is 0 where the request never reached a server, the case a caller usually retries.
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const BASE_URL = '/api';

// `qs`, not `URLSearchParams`, which loses an array; `repeat` is what `qs.parse` reads back unconfigured.
const urlFor = (path: string, query: RequestOptions['query']): string => {
  const rooted = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE_URL}${rooted}`;

  if (query === undefined) {
    return url;
  }

  const search = stringify(query, { arrayFormat: 'repeat' });

  return search === '' ? url : `${url}?${search}`;
};

// Answers parsed JSON or throws `ApiError`, so there is no `response.ok` to forget.
export const request = async <TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> => {
  const {
    method = 'GET',
    body,
    query,
    signal,
  } = options;

  let response: Response;

  try {
    // Spread: under `exactOptionalPropertyTypes` `RequestInit` refuses a property holding `undefined`.
    response = await fetch(urlFor(path, query), {
      method,
      ...(body === undefined
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
      ...(signal === undefined ? {} : { signal }),
    });
  }
  catch {
    // Never reached a server, so there is no status to report and 0 is what says so.
    throw new ApiError('The request could not be sent.', 0);
  }

  if (!response.ok) {
    throw new ApiError(`The request failed with status ${String(response.status)}.`, response.status);
  }

  // 204 and a genuinely empty body both parse to nothing, which is a success rather than a failure.
  const text = await response.text();

  return (text === '' ? undefined : JSON.parse(text)) as TResponse;
};
