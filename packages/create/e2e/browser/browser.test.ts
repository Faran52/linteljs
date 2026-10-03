import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { browserProblems, serveArgs } from './browser';

// Serves `PAGES` on `PORT`, answering 404 for any other route.
const SERVER = `
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const pages = JSON.parse(readFileSync('pages.json', 'utf8'));

createServer((request, response) => {
  const page = pages[request.url];

  response.writeHead(page === undefined ? 404 : 200, { 'content-type': 'text/html' });
  response.end(page ?? '<p>gone</p>');
}).listen(Number(process.env.PORT));
`;

const ORIGIN = /http:\/\/localhost:\d+/g;

const projectWith = (script: string, pages: Record<string, string> = {}): string => {
  const prefix = join(tmpdir(), 'browser-');
  const project = mkdtempSync(prefix);
  const scripts = { scripts: { preview: script } };
  const manifest = JSON.stringify(scripts);
  const served = JSON.stringify(pages);

  writeFileSync(join(project, 'package.json'), manifest);
  writeFileSync(join(project, 'serve.mjs'), SERVER);
  writeFileSync(join(project, 'pages.json'), served);

  return project;
};

describe('serveArgs', () => {
  it('runs the preview script, with the port as a flag where the server takes one', () => {
    const vite = serveArgs(projectWith('vite preview'), '4000');
    const next = serveArgs(projectWith('next start'), '4000');

    const expected = [
      'exec',
      'vite',
      'preview',
      '--port',
      '4000',
    ];
    expect(vite).toEqual(expected);

    const expectedNext = [
      'exec',
      'next',
      'start',
    ];
    expect(next).toEqual(expectedNext);
  });
});

describe('browserProblems', () => {
  it('finds nothing on a starter whose every linked route answers with a heading', async () => {
    const pages = {
      '/': '<h1>Home</h1><a href="/about?tab=1">About</a>',
      '/about': '<h1>About</h1><a href="/">Home</a>',
      '/favicon.ico': '',
    };
    const project = projectWith('node serve.mjs', pages);
    const problems = await browserProblems('pnpm', project);

    expect(problems).toEqual([]);
  }, 60_000);

  it('names a console error, a thrown error, a missing heading and a route that is not 200', async () => {
    const pages = {
      '/': '<h1>Home</h1><a href="/gone">Gone</a><script>console.error("boom"); throw new Error("bang");</script>',
    };
    const project = projectWith('node serve.mjs', pages);
    const problems = await browserProblems('pnpm', project);
    const named = problems
      .map((problem) => {
        return problem.replaceAll(ORIGIN, '');
      });

    const expected = [
      '/ console: boom',
      '/ page error: bang',
      '/gone: status 404',
      '/gone: no h1',
    ];
    const missing = expected
      .filter((problem) => {
        return !named.includes(problem);
      });

    expect(missing).toEqual([]);
  }, 60_000);
});
