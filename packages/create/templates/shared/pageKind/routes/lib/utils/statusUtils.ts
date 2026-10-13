import { STATUSES } from '@config/statuses';

// Throw it where a user lacks access, and the nearest boundary shows the 403 page in place of the 500.
export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

const KNOWN_STATUSES = [STATUSES.forbidden, STATUSES.notFound];

// Any other status is a crash, which shows the server error page.
export const knownStatus = (code: number): (typeof KNOWN_STATUSES)[number] | undefined => {
  return KNOWN_STATUSES.find((status) => {
    return status.code === code;
  });
};
