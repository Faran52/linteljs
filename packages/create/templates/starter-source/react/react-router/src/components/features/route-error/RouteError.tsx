import {
  isRouteErrorResponse,
  useLocation,
  useNavigate,
  useRouteError,
} from 'react-router';

import { STATUSES } from '../../../config/statuses';
import { ForbiddenError } from '../../../lib/utils/statusUtils';
import { StatusPage } from '../status-page/StatusPage';

import type { FC } from 'react';

// Any other error is a crash: a navigation to the same place is what resets React Router's boundary.
export const RouteError: FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();
  // A loader answers with a status; a component throws a ForbiddenError.
  const status = error instanceof ForbiddenError
    ? STATUSES.forbidden
    : [STATUSES.forbidden, STATUSES.notFound]
        .find(({ code }) => {
          return isRouteErrorResponse(error) && error.status === code;
        });

  if (status !== undefined) {
    return <StatusPage {...status} />;
  }

  return (
    <StatusPage
      {...STATUSES.serverError}
      onRetry={() => {
        void navigate(location, { replace: true });
      }}
    />
  );
};
