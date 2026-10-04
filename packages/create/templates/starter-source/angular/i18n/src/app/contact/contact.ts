import { Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { useSubmitContact } from '@apis/contact/contact-api';
import {
  type ContactValues,
  errorText,
  validateContact,
} from '@apis/contact/schemas';
import { t } from '@i18n';

import { Button } from '@ui/button/button';
import { TextInput } from '@ui/text-input/text-input';

@Component({
  imports: [
    ReactiveFormsModule,
    Button,
    TextInput,
  ],
  selector: 'app-contact',
  templateUrl: './contact.html',
})
export class Contact {
  protected readonly t = t;

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    message: new FormControl('', { nonNullable: true }),
  });

  protected readonly sent = signal(false);

  protected readonly sending = signal(false);

  private readonly submit = useSubmitContact();

  // Shown once a field is left: the form holds the values and what was touched, the rules stay shared.
  protected errorOf(name: keyof ContactValues): string | undefined {
    if (!this.form.controls[name].touched) {
      return undefined;
    }

    const found = validateContact(this.form.getRawValue());

    return errorText(found[name], t);
  }

  protected set(name: keyof ContactValues, value: string): void {
    this.form.controls[name].setValue(value);
  }

  protected blur(name: keyof ContactValues): void {
    this.form.controls[name].markAsTouched();
  }

  protected async send(): Promise<void> {
    this.form.markAllAsTouched();

    const values = this.form.getRawValue();
    const found = validateContact(values);

    if (Object.keys(found).length > 0) {
      return;
    }

    this.sending.set(true);
    await this.submit(values);
    this.sent.set(true);
  }
}
