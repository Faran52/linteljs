import { Component, signal } from '@angular/core';

import { injectForm, injectStore } from '@tanstack/angular-form';

import { useSubmitContact } from '@apis/contact/contact-api';
import { validateContactForm } from '@apis/contact/form-validator';
import { type ContactValues, errorText } from '@apis/contact/schemas';
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

  private readonly submit = useSubmitContact();

  protected readonly form = injectForm({
    defaultValues: {
      email: '',
      message: '',
    },
    validators: {
      // Every change re-runs the rules; a field shows its result only once it is left.
      onChange: validateContactForm,
    },
    onSubmit: async ({ value }) => {
      await this.submit(value);
      this.sent.set(true);
    },
  });

  // One subscription: a signal of the whole state, which the template reads.
  protected readonly state = injectStore(this.form, (current) => {
    return current;
  });

  protected errorOf(name: keyof ContactValues): string | undefined {
    const meta = this.state().fieldMeta[name];

    if (meta === undefined || (!meta.isBlurred && this.state().submissionAttempts === 0)) {
      return undefined;
    }

    const found = String(meta.errors[0]);

    return errorText(found, t);
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
        const blurred = {
          ...prev,
          isBlurred: true,
        };

        return blurred;
      });

    // A field left unchanged has not met the rules yet. `validateField` answers errors or a promise of them;
    // wrapping settles which for the promise rules.
    const validation = this.form.validateField(name, 'change');

    void Promise.resolve(validation);
  }

  protected send(event: Event): void {
    event.preventDefault();
    void this.form.handleSubmit();
  }
}
