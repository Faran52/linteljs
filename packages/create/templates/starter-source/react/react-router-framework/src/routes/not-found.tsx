import { data } from 'react-router';

import { STATUSES } from '@config/statuses';

import { StatusPage } from '@features/status-page/StatusPage';

import type { ReactNode } from 'react';

// A path no page claims matches here instead of short-circuiting past the root loader, so the layout keeps its data.
export const loader = (): ReturnType<typeof data<null>> => {
  return data(null, { status: STATUSES.notFound.code });
};

const NotFound = (): ReactNode => {
  return <StatusPage {...STATUSES.notFound} />;
};

export default NotFound;
