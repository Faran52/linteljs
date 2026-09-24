import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { emitExpoConfig, expoConfigEmitter } from './expoConfigEmitter';

describe('emitExpoConfig', () => {
  // A scheme is a URL host, so the separators and the case go while the name and the slug keep them.
  it('names the app, its slug and its scheme after the project', () => {
    expect(emitExpoConfig('Demo-App')).toContain([
      '    "name": "Demo-App",',
      '    "slug": "Demo-App",',
      '    "scheme": "demoapp",',
    ].join('\n'));
  });
});

describe('expoConfigEmitter', () => {
  it('writes app.json for a react native project', () => {
    expect(expoConfigEmitter({
      ...HOSTED_DEFAULTS,
      target: 'react-native',
    }, EMPTY_PROJECT, 'demo-app')).toEqual([{
      stage: 'standard',
      target: 'app.json',
      content: { text: emitExpoConfig('demo-app') },
    }]);
  });

  it('writes nothing for any other target', () => {
    expect(expoConfigEmitter(HOSTED_DEFAULTS, EMPTY_PROJECT, 'demo-app')).toEqual([]);
  });
});
