// `useSubmitContact` alone: it is the one shape all three data answers share, and RTK Query's spelling of this
// module has no plain `submitContact` to re-export.
export { useSubmitContact } from './api';
export {
  type ContactErrors,
  type ContactValues,
  validateContact,
} from './schemas';
