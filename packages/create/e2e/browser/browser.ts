import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { kill } from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

import { chromium, type Page } from 'playwright-core';

import { parsePackageJson } from '@emitters';

import { launcherFreeEnv } from '../utils/processUtils';

import {
  BROWSER_OPTIONS,
  HEADING_TIMEOUT,
  HTML_LANG,
  LANGUAGE_PICKER,
  OK_STATUS,
  OTHER_LANGUAGE,
  POLL_INTERVAL,
  PORT_FLAGGED,
  ROUTE_SUFFIX,
  SERVER_RENDERED,
  SERVER_TIMEOUT,
  STARTER_LINKS,
  VIEW_CONTROLS,
} from './constants';

import type { Answers } from '@config/types';

const freePort = async (): Promise<string> => {
  return new Promise((settle) => {
    const server = createServer();

    const release = (): void => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;

      server
        .close(() => {
          settle(String(port));
        });
    };

    server.listen(0, release);
  });
};

// `check` built it. The servers without a port flag (next, nuxt, react-router-serve) read `PORT`.
const serveArgs = (project: string, port: string): string[] => {
  const manifest = readFileSync(join(project, 'package.json'), 'utf8');
  const { scripts = {} } = parsePackageJson(manifest);
  const script = scripts['preview'] ?? scripts['start'] ?? scripts['dev'] ?? '';
  const words = script.split(' ');
  const [bin = ''] = words;
  const args = ['exec', ...words];

  if (PORT_FLAGGED.has(bin)) {
    args.push('--port', port);
  }

  return args;
};

const settles = async <T>(pending: Promise<T>): Promise<boolean> => {
  try {
    await pending;

    return true;
  }
  catch {
    return false;
  }
};

const answers = async (origin: string): Promise<boolean> => {
  const deadline = Date.now() + SERVER_TIMEOUT;

  while (Date.now() < deadline) {
    const isUp = await settles(fetch(origin));

    if (isUp) {
      return true;
    }

    await sleep(POLL_INTERVAL);
  }

  return false;
};

// Read from Node, not the page: a page-side callback would carry Stryker's instrumentation into the browser.
const linksOn = async (page: Page): Promise<string[]> => {
  const anchors = await page
    .locator(STARTER_LINKS)
    .all();
  const reads = anchors
    .map(async (anchor) => {
      return anchor.getAttribute('href');
    });
  const hrefs = await Promise.all(reads);

  return hrefs
    .map((href) => {
      // The selector only matches anchors with an `href`, so `String` never sees null.
      const [route = ''] = String(href).split(ROUTE_SUFFIX);

      return route;
    });
};

const headed = async (page: Page): Promise<boolean> => {
  const heading = page
    .locator('h1')
    .first()
    .waitFor({ timeout: HEADING_TIMEOUT });

  return settles(heading);
};

// A starter without a router swaps views from buttons, so each view is reached by a click.
const clickThrough = async (page: Page, origin: string): Promise<string[]> => {
  await page.goto(origin);

  const controls = await page
    .locator(VIEW_CONTROLS)
    .all();
  const problems: string[] = [];

  if (controls.length === 0) {
    problems.push('/: links no route and has no view controls, so the pass checked one page');
  }

  for (const control of controls) {
    const label = await control.textContent();

    await control.click();

    const hasHeading = await headed(page);

    if (!hasHeading) {
      problems.push(`/ ${String(label)} view: no h1`);
    }
  }

  return problems;
};

// A language chosen in the page reaches the server, so the raw HTML of another route already carries it.
const languageProblems = async (page: Page, origin: string, route: string): Promise<string[]> => {
  await page.goto(origin, { waitUntil: 'networkidle' });

  const picker = page
    .locator(LANGUAGE_PICKER)
    .first();
  const offered = await picker
    .locator(OTHER_LANGUAGE)
    .first()
    .getAttribute('value');
  const language = String(offered);

  await picker.selectOption(language);

  await page
    .locator(`html[lang="${language}"]`)
    .waitFor({ state: 'attached', timeout: HEADING_TIMEOUT });

  const response = await page.request.get(`${origin}${route}`);
  const html = await response.text();
  const served = HTML_LANG.exec(html)?.groups?.['lang'];

  if (served === language) {
    return [];
  }

  const wrong = [`${route}: served lang ${String(served)} after choosing ${language}`];

  return wrong;
};

// Every route the starter links from its first page, each loaded fresh so the server answers it too.
const crawl = async (origin: string, servesLanguage: boolean): Promise<string[]> => {
  const browser = await chromium.launch(BROWSER_OPTIONS);
  const problems: string[] = [];

  try {
    const page = await browser.newPage();

    page
      .on('console', (message) => {
        if (message.type() === 'error') {
          problems.push(`${page.url()} console: ${message.text()}`);
        }
      });

    page
      .on('pageerror', (error) => {
        problems.push(`${page.url()} page error: ${error.message}`);
      });

    const routes = ['/'];

    for (const route of routes) {
      const response = await page.goto(`${origin}${route}`);
      const status = response?.status();

      if (status !== OK_STATUS) {
        problems.push(`${route}: status ${String(status)}`);
      }

      const hasHeading = await headed(page);

      if (!hasHeading) {
        problems.push(`${route}: no h1`);
      }

      const links = await linksOn(page);

      for (const link of links) {
        if (!routes.includes(link)) {
          routes.push(link);
        }
      }
    }

    const linkedNothing = routes.length === 1;

    if (linkedNothing) {
      const viewProblems = await clickThrough(page, origin);

      problems.push(...viewProblems);
    }

    const [, route = '/'] = routes;

    if (servesLanguage) {
      const languageProblemsSeen = await languageProblems(page, origin, route);

      problems.push(...languageProblemsSeen);
    }
  }
  finally {
    await browser.close();
  }

  return problems;
};

export const browserProblems = async (chosen: Answers, project: string): Promise<string[]> => {
  const pm = chosen.packageManager;
  const servesLanguage = chosen.languages !== undefined
    && (SERVER_RENDERED.has(chosen.target) || chosen.router === 'react-router-framework');
  const port = await freePort();
  const origin = `http://localhost:${port}`;
  const args = serveArgs(project, port);
  const inherited = launcherFreeEnv();
  const serverEnv = {
    ...inherited,
    PORT: port,
  };
  const options = {
    cwd: project,
    stdio: 'ignore' as const,
    // Its own group, so the kill reaches what `pnpm exec` started.
    detached: true,
    env: serverEnv,
  };
  const server = spawn(pm, args, options);

  try {
    const isUp = await answers(origin);

    if (!isUp) {
      const noServer = [`no server on ${origin}`];

      return noServer;
    }

    const problems = await crawl(origin, servesLanguage);

    return problems;
  }
  finally {
    // A server that exited on its own has no group left to kill.
    const isRunning = server.pid !== undefined && server.exitCode === null;

    if (isRunning) {
      kill(-server.pid, 'SIGKILL');
    }
  }
};
