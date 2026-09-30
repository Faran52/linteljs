// The line each status page shows under its code: the code carries the detail.
export const STATUSES = {
  forbidden: {
    code: 403,
    message: "You don't have access to this page",
  },
  notFound: {
    code: 404,
    message: 'Page not found',
  },
  serverError: {
    code: 500,
    message: 'Something went wrong',
  },
} as const;
