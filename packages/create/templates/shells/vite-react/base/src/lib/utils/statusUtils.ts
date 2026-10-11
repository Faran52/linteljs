// Throw it where a user lacks access, and the nearest boundary shows the 403 page in place of the 500.
export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
