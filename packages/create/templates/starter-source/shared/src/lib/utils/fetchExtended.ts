import { stringify } from 'qs';

/*
 * `object` for the body, which is the one spelling that survives both gates. `unknown`, `unknown[]` and
 * `Record<string, unknown>` are refused by the standard's floor, and a second type parameter does not work either:
 * TypeScript takes type arguments all or nothing, so naming the response would silently pin the body to its
 * default at every call site. A body is a document, and `object` says that without widening to a bag.
 */
export type QueryValue = string | number | boolean | readonly string[] | readonly number[];

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly body?: object;
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly signal?: AbortSignal;
}

/*
 * What a failed request throws, so a caller can tell one apart from a bug. `status` is the server's, or 0 where
 * the request never reached one, which is the case a caller usually wants to retry and a bug never is.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const BASE_URL = '/api';

/*
 * `qs` rather than `URLSearchParams`, for the one thing the platform will not do: an array. `URLSearchParams`
 * stringifies `['a', 'b']` to `a,b` and loses the shape, where `qs` writes `tag=a&tag=b` and parses it back to an
 * array on the other side.
 *
 * `repeat` of the three formats it offers. `brackets` writes `tag[]=a`, which is a Rails and PHP convention rather
 * than a general one, and `comma` collapses to the string this exists to avoid. `repeat` is what `qs.parse` reads
 * back without being told the format, so both halves agree with no configuration shared between them.
 */
const urlFor = (path: string, query: RequestOptions['query']): string => {
  const rooted = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE_URL}${rooted}`;

  if (query === undefined) {
    return url;
  }

  const search = stringify(query, { arrayFormat: 'repeat' });

  return search === '' ? url : `${url}?${search}`;
};

/**
 * One place that speaks HTTP, which is what `apis/` means and what nothing above it should know about.
 *
 * It answers parsed JSON or throws `ApiError`, so every caller has two cases rather than four: there is no
 * `response.ok` to forget and no second parse to get wrong. A query layer wraps this rather than replacing it,
 * which is why the same function is underneath TanStack Query, RTK Query and a plain call.
 */
export const request = async <TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> => {
  const {
    method = 'GET',
    body,
    query,
    signal,
  } = options;

  let response: Response;

  try {
    /*
     * Spread rather than set to `undefined`. Under `exactOptionalPropertyTypes` an absent property and one holding
     * `undefined` are different types, and `RequestInit` accepts the first and refuses the second.
     */
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
