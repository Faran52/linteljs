import {
  AGENTS,
  DEFAULT_ANSWERS,
  PLUGINS,
} from './answers';

describe('answer vocabulary', () => {
  it('lists the supported agents and plugins with their defaults', () => {
    expect(AGENTS).toEqual(['claude-code', 'codex', 'copilot', 'cursor']);
    expect(PLUGINS).toEqual(['ponytail', 'context7', 'frontend-design']);
    expect(DEFAULT_ANSWERS.agents).toEqual(['claude-code']);
    expect(DEFAULT_ANSWERS.plugins).toEqual(PLUGINS);
  });
});
