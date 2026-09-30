// The line each status page shows under its code, as a key into `src/i18n/locales/`: the code carries the detail.
export const STATUSES = {
  forbidden: {
    code: 403,
    message: 'statusForbidden',
  },
  notFound: {
    code: 404,
    message: 'statusNotFound',
  },
  serverError: {
    code: 500,
    message: 'statusServerError',
  },
} as const;
