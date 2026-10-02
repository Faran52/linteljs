import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { angularConfigEmitter, emitAngularConfig } from './angularConfigEmitter';

import type { HostedAnswers } from '@config/types';

describe('emitAngularConfig', () => {
  it('writes the Angular CLI project file, keyed by the project name', () => {
    expect(JSON.parse(emitAngularConfig('demo-app', 'pnpm'))).toStrictEqual({
      $schema: './node_modules/@angular/cli/lib/config/schema.json',
      version: 1,
      cli: { packageManager: 'pnpm' },
      newProjectRoot: 'projects',
      projects: {
        'demo-app': {
          projectType: 'application',
          schematics: {},
          root: '',
          sourceRoot: 'src',
          prefix: 'app',
          architect: {
            build: {
              builder: '@angular/build:application',
              options: {
                browser: 'src/main.ts',
                tsConfig: 'tsconfig.app.json',
                index: 'src/index.html',
                assets: [{
                  glob: '**/*',
                  input: 'public',
                }],
                styles: ['src/styles.css'],
              },
              configurations: {
                production: {
                  budgets: [
                    {
                      type: 'initial',
                      maximumWarning: '500kB',
                      maximumError: '1MB',
                    },
                    {
                      type: 'anyComponentStyle',
                      maximumWarning: '4kB',
                      maximumError: '8kB',
                    },
                  ],
                  outputHashing: 'all',
                },
                development: {
                  optimization: false,
                  extractLicenses: false,
                  sourceMap: true,
                },
              },
              defaultConfiguration: 'production',
            },
            serve: {
              builder: '@angular/build:dev-server',
              configurations: {
                production: { buildTarget: 'demo-app:build:production' },
                development: { buildTarget: 'demo-app:build:development' },
              },
              defaultConfiguration: 'development',
            },
            test: { builder: '@angular/build:unit-test' },
          },
        },
      },
    });
  });

  it('names the package manager the project was created with', () => {
    const angularConfig = emitAngularConfig('demo-app', 'yarn');
    expect(angularConfig).toContain('"cli": {\n    "packageManager": "yarn"\n  }');
  });
});

describe('angularConfigEmitter', () => {
  it('writes angular.json for an angular project', () => {
    const answers: HostedAnswers = {
      ...HOSTED_DEFAULTS,
      target: 'angular',
    };

    const angularConfig = angularConfigEmitter(answers, EMPTY_PROJECT, 'demo-app');
    const expected = [{
      stage: 'standard',
      target: 'angular.json',
      content: { text: emitAngularConfig('demo-app', answers.packageManager) },
    }];
    expect(angularConfig).toEqual(expected);
  });

  it('writes nothing for any other target', () => {
    const angularConfig = angularConfigEmitter(HOSTED_DEFAULTS, EMPTY_PROJECT, 'demo-app');
    expect(angularConfig).toEqual([]);
  });
});
