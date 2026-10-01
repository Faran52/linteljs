import { STATUSES } from '@config/statuses';

import { StatusPage } from '@features/status-page/StatusPage';

import type { ReactNode } from 'react';

const { code, message } = STATUSES.notFound;

const NotFoundScreen = (): ReactNode => {
  return <StatusPage code={code} message={message} />;
};

export default NotFoundScreen;
