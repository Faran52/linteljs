// Angular's test environment, initialized once for the whole run, plus every global mock.
// `@angular/compiler` is imported for its side effect: an inline `template` is compiled JIT here.
import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
