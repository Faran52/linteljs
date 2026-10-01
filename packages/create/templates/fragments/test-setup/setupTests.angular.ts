import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// `@angular/compiler` is imported for its side effect: an inline `template` is compiled JIT here.
import '@angular/compiler';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
