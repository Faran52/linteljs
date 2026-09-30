import { STATUSES } from '../../../config/statuses';
import { StatusPage } from '../status-page/StatusPage';

import type { ErrorComponentProps } from '@tanstack/react-router';
import type { FC } from 'react';

export const RouteError: FC<ErrorComponentProps> = ({ reset }) => {
  return <StatusPage {...STATUSES.serverError} onRetry={reset} />;
};
