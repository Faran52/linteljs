import { Component, signal } from '@angular/core';

import { injectForm, injectStore } from '@tanstack/angular-form';

import { type ContactValues, validateContact } from '@apis/contact/schemas';
import { t } from '@i18n';

import { Button } from '@ui/button/button';
import { TextInput } from '@ui/text-input/text-input';

@Component({
  imports: [Button, TextInput],
  selector: 'app-contact',
  templateUrl: './contact.html',
})
export class Contact {
  protected readonly t = t;

  protected readonly sent = signal(false);

  protected readonly form = injectForm({
    defaultValues: {
      email: '',
      message: '',
    },
    validators: {
      // Every change re-runs the rules; a field shows its result only once it is left.
      onChange: ({ value }) => {
        const found = validateContact(value);

        return Object.keys(found).length > 0 ? { fields: found } : undefined;
      },
    },
    onSubmit: () => {
      this.sent.set(true);
    },
  });

  // One subscription: a signal of the whole state, which the template reads.
  protected readonly state = injectStore(this.form, (current) => {
    return current;
  });

  protected errorOf(name: keyof ContactValues): string | undefined {
    // Read inline: `errors` is an `any[]`, so naming its first element would be an unsafe assignment.
    const meta = this.state().fieldMeta[name];

    if (meta === undefined || (!meta.isBlurred && this.state().submissionAttempts === 0)) {
      return undefined;
    }

    return meta.errors[0] === undefined ? undefined : String(meta.errors[0]);
  }

  // Open until a send is tried, which names what is missing; then held until the rules pass.
  protected canSubmit(): boolean {
    return this.state().submissionAttempts === 0 || this.state().canSubmit;
  }

  protected set(name: keyof ContactValues, value: string): void {
    this.form.setFieldValue(name, value);
  }

  protected blur(name: keyof ContactValues): void {
    this.form
      .setFieldMeta(name, (prev) => {
        return {
          ...prev,
          isBlurred: true,
        };
      });

    // A field left unchanged has not met the rules yet. `validateField` answers errors or a promise of them;
    // wrapping settles which for the promise rules.
    void Promise.resolve(this.form.validateField(name, 'change'));
  }

  protected send(event: Event): void {
    event.preventDefault();
    void this.form.handleSubmit();
  }
}
