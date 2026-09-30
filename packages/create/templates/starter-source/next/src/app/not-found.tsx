import { StatusPage } from '../components/features/status-page/StatusPage';
import { STATUSES } from '../config/statuses';

import type { ReactNode } from 'react';

const NotFound = (): ReactNode => {
  return <StatusPage {...STATUSES.notFound} />;
};

export default NotFound;
