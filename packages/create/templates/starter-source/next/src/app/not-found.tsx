import { STATUSES } from '@config/statuses';

import { StatusPage } from '@features/status-page/StatusPage';

import type { ReactNode } from 'react';

const NotFound = (): ReactNode => {
  return <StatusPage {...STATUSES.notFound} />;
};

export default NotFound;
