import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { type HostedAnswers } from '@answers';

import { angularConfigEmitter, emitAngularConfig } from './angularConfigEmitter';

// The slice of `angular.json` these cases read.
interface ServeConfiguration {
  buildTarget: string;
}

interface Serve {
  configurations: Record<string, ServeConfiguration>;
}

interface Architect {
  serve: Serve;
}

interface AngularProject {
  architect: Architect;
}

interface AngularCli {
  packageManager: string;
}

interface AngularJson {
  cli: AngularCli;
  projects: Record<string, AngularProject>;
}

const isAngularJson = (value: unknown): value is AngularJson => {
  return typeof value === 'object' && value !== null && 'projects' in value && 'cli' in value;
};

const parsed = (text: string): AngularJson => {
  const value: unknown = JSON.parse(text);

  if (!isAngularJson(value)) {
    throw new Error('not an angular.json');
  }

  return value;
};

describe('emitAngularConfig', () => {
  // Every `buildTarget` names the project, which is why the file is written rather than copied.
  it('keys the project and every build target by the project name', () => {
    const config = parsed(emitAngularConfig('demo-app', 'pnpm'));

    expect(Object.keys(config.projects)).toEqual(['demo-app']);
    expect(config.projects['demo-app']?.architect.serve.configurations['development']?.buildTarget)
      .toBe('demo-app:build:development');
  });

  it('names the package manager the project was created with', () => {
    expect(parsed(emitAngularConfig('demo-app', 'yarn')).cli.packageManager).toBe('yarn');
  });
});

describe('angularConfigEmitter', () => {
  it('writes angular.json for an angular project', () => {
    const answers: HostedAnswers = {
      ...HOSTED_DEFAULTS,
      target: 'angular',
    };

    expect(angularConfigEmitter(answers, EMPTY_PROJECT, 'demo-app')).toEqual([{
      stage: 'standard',
      target: 'angular.json',
      content: { text: emitAngularConfig('demo-app', answers.packageManager) },
    }]);
  });

  it('writes nothing for any other target', () => {
    expect(angularConfigEmitter(HOSTED_DEFAULTS, EMPTY_PROJECT, 'demo-app')).toEqual([]);
  });
});
