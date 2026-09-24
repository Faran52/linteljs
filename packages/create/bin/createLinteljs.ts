#!/usr/bin/env node
import process, { argv } from 'node:process';

import { main } from '../src/index.ts';

// `exitCode` rather than `exit()`: node leaves once the event loop drains, so a failure message
// already written to a pipe is not truncated on the way out.
process.exitCode = await main(argv.slice(2));
