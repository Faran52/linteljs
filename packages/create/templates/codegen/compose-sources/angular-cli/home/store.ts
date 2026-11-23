import { type Type } from '@angular/core';
import { type ComponentFixture } from '@angular/core/testing';

import { type Home } from './home';

export const storeImports: readonly Type<object>[] = [];

export class StoreMembers {}

export const storeCases = (rootOf: (harness: ComponentFixture<Home>) => HTMLElement): void => {};
