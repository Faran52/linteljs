import {
  type ContactErrors,
  type ContactValues,
  validateContact,
} from './schemas';

// Named: an options getter, as Solid and Svelte take them, gives TypeScript no contextual type.
export interface ContactSubmission {
  value: ContactValues;
}

export interface ContactFormErrors {
  fields: ContactErrors;
}

// TanStack Form's form-level validator: the errors per field, or none once every rule passes.
export const validateContactForm = ({ value }: ContactSubmission): ContactFormErrors | undefined => {
  const found = validateContact(value);

  const errors = Object.keys(found).length > 0 ? { fields: found } : undefined;

  return errors;
};
