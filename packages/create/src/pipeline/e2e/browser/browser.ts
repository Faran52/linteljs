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
  POLL_INTERVAL,
  PORT_FLAGGED,
  ROUTE_SUFFIX,
  SERVER_TIMEOUT,
  STARTER_LINKS,
} from './constants';

import type { PackageManager } from '@config/types';

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
export const serveArgs = (project: string, port: string): string[] => {
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

// Every route the starter links from its first page, each loaded fresh so the server answers it too.
const crawl = async (origin: string): Promise<string[]> => {
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

      if (status !== 200) {
        problems.push(`${route}: status ${String(status)}`);
      }

      const heading = page
        .locator('h1')
        .first()
        .waitFor({ timeout: HEADING_TIMEOUT });
      const hasHeading = await settles(heading);

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
  }
  finally {
    await browser.close();
  }

  return problems;
};

export const browserProblems = async (pm: PackageManager, project: string): Promise<string[]> => {
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

    const problems = await crawl(origin);

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
