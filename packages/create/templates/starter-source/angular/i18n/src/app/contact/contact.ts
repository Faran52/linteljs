import { Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { type ContactValues, validateContact } from '@apis/contact/schemas';
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

  // Shown once a field is left: the form holds the values and what was touched, the rules stay shared.
  protected errorOf(name: keyof ContactValues): string | undefined {
    if (!this.form.controls[name].touched) {
      return undefined;
    }

    const found = validateContact(this.form.getRawValue());

    return found[name];
  }

  protected set(name: keyof ContactValues, value: string): void {
    this.form.controls[name].setValue(value);
  }

  protected blur(name: keyof ContactValues): void {
    this.form.controls[name].markAsTouched();
  }

  protected send(): void {
    this.form.markAllAsTouched();

    const found = validateContact(this.form.getRawValue());

    if (Object.keys(found).length === 0) {
      this.sent.set(true);
    }
  }
}
