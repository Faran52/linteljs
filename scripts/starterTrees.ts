import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import {
  ANSWERS,
  type Answers,
  DEFAULT_ANSWERS,
  type TargetId,
} from '../packages/create/src/answers';
import { EMPTY_PROJECT } from '../packages/create/src/config/constants';
import { buildArtifacts, seedArtifacts } from '../packages/create/src/emitters/registry';
import { targetFor } from '../packages/create/src/targets';
import { valuesOf } from '../packages/create/src/utils/objectUtils';

/**
 * The tree every target is actually generated with, rendered as one page.
 *
 * Read off the emitters rather than off a project on disk, so it is the same list `create` writes and cannot drift
 * from it: a file that stops being emitted stops appearing here on the next run. `v2-trees.html` beside it is the
 * tree that was proposed; this is the tree that exists.
 */
interface Branch {
  readonly directories: Map<string, Branch>;
  readonly files: string[];
}

interface Tree {
  readonly html: string;
  readonly count: number;
}

const emptyBranch = (): Branch => {
  return {
    directories: new Map<string, Branch>(),
    files: [],
  };
};

const insert = (root: Branch, path: string): void => {
  const segments = path.split('/');
  let branch = root;

  for (const segment of segments.slice(0, -1)) {
    const next = branch.directories.get(segment) ?? emptyBranch();

    branch.directories.set(segment, next);
    branch = next;
  }

  const leaf = segments.at(-1);

  if (leaf !== undefined) {
    branch.files.push(leaf);
  }
};

const countOf = (branch: Branch): number => {
  return branch.files.length + [...branch.directories.values()].reduce((total, child) => {
    return total + countOf(child);
  }, 0);
};

const escape = (value: string): string => {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
};

// Colour follows what decides the file, which is the one thing a reader wants from a tree this size.
const classOf = (path: string): string => {
  if (path.includes('/mocks/') || path.includes('fetchExtended') || path.includes('fetch-extended')) {
    return 'api';
  }

  if (/use-extended|create-extended|extended-(query|mutation)|baseApi/.test(path)) {
    return 'api';
  }

  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx') || path.endsWith('.spec.ts')) {
    return 'test';
  }

  if (path.includes('/styles/') || path.endsWith('.css')) {
    return 'style';
  }

  if (path.startsWith('src/')) {
    return 'base';
  }

  return 'cfg';
};

const render = (branch: Branch, prefix: string): string => {
  const directories = [...branch.directories.entries()].sort(([left], [right]) => {
    return left.localeCompare(right, 'en');
  }).map(([name, child]) => {
    const inner = render(child, `${prefix}${name}/`);

    return `<details open><summary><span class="dir">${escape(name)}/</span>`
      + `<span class="n">${String(countOf(child))}</span></summary>`
      + `<div class="kids">${inner}</div></details>`;
  });

  const files = [...branch.files].sort((left, right) => {
    return left.localeCompare(right, 'en');
  }).map((name) => {
    const path = `${prefix}${name}`;

    return `<div class="f ${classOf(path)}"><code>${escape(name)}</code></div>`;
  });

  return [...directories, ...files].join('');
};

const answersFor = (target: TargetId): Answers => {
  const record = targetFor({
    ...DEFAULT_ANSWERS,
    target,
  });
  const [store] = record.stores ?? [];
  const [router] = record.routers ?? [];

  return {
    ...DEFAULT_ANSWERS,
    target,
    testing: 'vitest',
    libraries: ['zod'],
    form: 'tanstack-form',
    data: 'tanstack-query',
    mocking: 'msw',
    agents: ['claude-code'],
    ...(store === undefined ? {} : { store }),
    ...(router === undefined ? {} : { router }),
  };
};

const treeFor = (target: TargetId): Tree => {
  const answers = answersFor(target);
  const paths = [
    ...buildArtifacts(answers, EMPTY_PROJECT, 'demo-app'),
    ...seedArtifacts(answers, 'demo-app', EMPTY_PROJECT),
  ].map((artifact) => {
    return artifact.target;
  });

  const root = emptyBranch();

  for (const path of [...new Set(paths)]) {
    insert(root, path);
  }

  return {
    html: render(root, ''),
    count: countOf(root),
  };
};

const targets = valuesOf(ANSWERS.target.values);

const sections = targets.map((target) => {
  const { html, count } = treeFor(target);
  const record = targetFor(answersFor(target));

  return `
<section class="target">
  <h2>${escape(target)}<span class="count">${String(count)} files</span></h2>
  <p class="tnote">${escape(record.routeUnit)}</p>
  <div class="tree">${html}</div>
</section>`;
}).join('');

const document_ = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>linteljs v2 generated trees</title>
<link rel="stylesheet" href="./tokens.css" />
<style>
* { box-sizing: border-box; }
body { margin: 0; background: var(--background); color: var(--foreground);
  font-family: var(--font-sans); line-height: 1.5; -webkit-font-smoothing: antialiased; }
code { font-family: var(--font-mono); font-size: 0.75rem; }
.wrap { max-width: 56rem; margin: 0 auto; padding: 2.5rem 1.25rem 5rem; }
h1 { margin: 0 0 0.25rem; font-size: 1.25rem; font-weight: 620; letter-spacing: -0.02em; }
.lede { margin: 0 0 1.5rem; color: var(--muted-foreground); font-size: var(--text-value); max-width: 44rem; }
.legend { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 1.5rem;
  padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); }
.key { display: flex; align-items: center; gap: 0.375rem; font-size: var(--text-body); }
.sw { width: 9px; height: 9px; border-radius: 2px; flex: none; }
.target { margin-bottom: 2.25rem; }
h2 { margin: 0 0 0.25rem; font-size: 0.9375rem; font-weight: 620;
  display: flex; align-items: baseline; gap: 0.625rem; }
.count { font-size: var(--text-body); font-weight: 400; color: var(--faint); }
.tnote { margin: 0 0 0.75rem; font-size: var(--text-body); color: var(--muted-foreground); }
.tree { border: 1px solid var(--border); border-radius: var(--radius-lg);
  background: var(--card); padding: 0.625rem 0.875rem; }
.kids { padding-left: 0.75rem; margin-left: 0.3125rem; border-left: 1px solid var(--hair); }
summary { cursor: pointer; padding: 0.125rem 0; list-style: none;
  display: flex; align-items: baseline; gap: 0.5rem; }
summary::-webkit-details-marker { display: none; }
summary::before { content: '\\25BE'; font-size: 0.6rem; color: var(--dim); width: 0.75rem; flex: none; }
details:not([open]) > summary::before { content: '\\25B8'; }
.dir { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 620; color: var(--foreground-2); }
.n { font-size: 0.65rem; color: var(--dim); }
.f { display: flex; align-items: baseline; gap: 0.5rem;
  padding: 0.125rem 0 0.125rem 1.5rem; position: relative; }
.f::before { content: ''; position: absolute; left: 0.5rem; top: 0.45rem;
  width: 7px; height: 7px; border-radius: 2px; }
.base::before { background: var(--dim); }
.test::before { background: #b8863c; }
.style::before { background: #c2607a; }
.api::before { background: #7c6ae0; }
.cfg::before { background: var(--border); }
</style>
</head>
<body>
<div class="wrap">
  <h1>linteljs v2 generated trees</h1>
  <p class="lede">Every target, at the heaviest answer set it offers: vitest, zod, a form, TanStack Query, MSW,
  Claude Code, and whichever store and router the target has. Read off the emitters rather than off a project on
  disk, so this is the same list <code>create</code> writes and cannot drift from it.</p>

  <div class="legend">
    <span class="key"><span class="sw" style="background:var(--dim)"></span>source</span>
    <span class="key"><span class="sw" style="background:#7c6ae0"></span>api edge</span>
    <span class="key"><span class="sw" style="background:#b8863c"></span>suite</span>
    <span class="key"><span class="sw" style="background:#c2607a"></span>styles</span>
    <span class="key"><span class="sw" style="background:var(--border)"></span>config</span>
  </div>
  ${sections}
</div>
</body>
</html>
`;

const out = join(import.meta.dirname, '../template-scaffolder-temporary/v2-generated-trees.html');

writeFileSync(out, document_);
process.stdout.write(`${String(targets.length)} trees written to ${out}\n`);
