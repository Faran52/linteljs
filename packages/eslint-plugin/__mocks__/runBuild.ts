import {
  type Build,
  indexAst,
  type State,
} from '../scripts/audit/false-negatives/utils/editUtils.ts';
import { parse } from '../scripts/audit/utils/astUtils.ts';

interface Built {
  offset: number | undefined;
  output: string | undefined;
  skips: string[];
}

// Runs one false-negatives edit over a source, as the audit would.
export const runBuild = (build: Build, source: string, name = 'file.ts'): Built => {
  const ast = parse(source, name);
  const skips: string[] = [];
  const state: State = {
    ast,
    index: indexAst(ast),
    source,
    skip: (reason) => {
      skips.push(reason);
    },
  };
  const candidate = build(state);
  const built = {
    offset: candidate?.offset,
    output: candidate?.source,
    skips,
  };

  return built;
};
