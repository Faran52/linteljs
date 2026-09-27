import { answersFor } from '@mocks/agentRules';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';
import { shippedAssetsReader } from '@disk';

import { linteljsPluginEmitter } from '../../always/linteljs-plugin/linteljsPluginEmitter';

import { copilotHooksEmitter } from './copilotHooksEmitter';

describe('copilotHooksEmitter', () => {
  it.each(['claude-code', 'codex', 'cursor'] as const)('writes nothing for %s without Copilot', (agent) => {
    expect(copilotHooksEmitter(answersFor([agent]))).toEqual([]);
  });

  it('writes one hooks file linteljs owns outright', async () => {
    const [artifact, ...rest] = copilotHooksEmitter(answersFor(['copilot']));

    expect(rest).toEqual([]);
    expect(artifact?.stage).toBe('standard');
    expect(artifact?.target).toBe('.github/hooks/linteljs.json');
    expect(artifact?.preserve).toBeUndefined();
    expect(JSON.parse(artifact === undefined ? '' : await shippedAssetsReader(artifact.content))).toEqual({
      version: 1,
      hooks: {
        preToolUse: [
          {
            type: 'command',
            matcher: 'bash|powershell',
            command: 'node plugins/linteljs/hooks/gitSafetyGuardHook.ts',
            cwd: '.',
          },
        ],
        postToolUse: [
          {
            type: 'command',
            matcher: 'bash|powershell',
            command: 'node plugins/linteljs/hooks/eslintFixWarningHook.ts',
            cwd: '.',
          },
          {
            type: 'command',
            matcher: 'edit|create|str_replace_editor|apply_patch',
            command: 'node plugins/linteljs/hooks/bannedPatternGuardHook.ts',
            cwd: '.',
          },
        ],
      },
    });
  });

  it('runs only hook scripts the plugin tree ships', async () => {
    const [artifact] = copilotHooksEmitter(answersFor(['copilot']));
    const text = artifact === undefined ? '' : await shippedAssetsReader(artifact.content);
    const pluginTargets = linteljsPluginEmitter(DEFAULT_ANSWERS)
      .map(({ target }) => {
        return target;
      });

    const shipped = new Set(pluginTargets);
    const scripts = [...text.matchAll(/node ([^"\s]+)"/gu)]
      .map((match) => {
        return match[1];
      });

    expect(scripts).toHaveLength(3);

    const allShipped = scripts
      .every((script) => {
        return script !== undefined && shipped.has(script);
      });

    expect(allShipped).toBe(true);
  });
});
