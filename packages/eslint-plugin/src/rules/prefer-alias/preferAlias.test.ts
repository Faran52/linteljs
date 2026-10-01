import { join } from 'node:path';

import {
  ALIASED_PROJECT,
  tsRuleTester,
  typedRuleTester,
} from '@mocks/ruleTesters';

import { preferAlias } from './preferAlias.ts';

const at = (path: string): string => {
  return join(ALIASED_PROJECT, 'src', path);
};

const ROUTES_EXEMPT = {
  aliasExempt: ['src/routes.ts'],
  enforceRelativeImports: true,
};

tsRuleTester.run('prefer-alias untyped', preferAlias, {
  valid: ["import { value } from '../config/env';"],
  invalid: [],
});

typedRuleTester.run('prefer-alias', preferAlias, {
  valid: [
    {
      code: "import { value } from './env';",
      filename: at('config/theme.ts'),
    },
    {
      // One aliased directory: `flags/` sits inside `@config`, whose `@config/flags/*` points elsewhere.
      code: "import { value } from '../env';",
      filename: at('config/flags/on.ts'),
    },
    {
      code: "import { value } from './nested/view';",
      filename: at('app/page.ts'),
    },
    {
      code: "import { value } from '../page';",
      filename: at('app/nested/view.ts'),
    },
    {
      code: "import { value } from '../nowhere';",
      filename: at('app/page.ts'),
    },
    {
      code: "import { value } from '@config/env';",
      filename: at('app/page.ts'),
    },
    {
      code: "import { value } from '@ui/button';",
      filename: at('components/card.ts'),
    },
    {
      code: "import { value } from '@ui';",
      filename: at('app/page.ts'),
    },
    {
      code: "import { value } from '../config/missing';",
      filename: at('app/page.ts'),
    },
    {
      // `@config/flags/on` would resolve through `@config/flags/*` to `src/lib/`.
      code: "import { value } from '../config/flags/on';",
      filename: at('app/page.ts'),
    },
    {
      code: "import { value } from '../config/env';",
      filename: at('app/page.ts'),
      options: [{ aliasExempt: ['src/app/**'] }],
    },
    {
      code: "import { value } from '@config/env';",
      filename: at('routes.ts'),
      options: [{ aliasExempt: ['src/routes.ts'] }],
    },
    {
      // Resolved by the second `paths` entry, so the first is not where it points.
      code: "import { value } from '@generated/client';",
      filename: at('routes.ts'),
      options: [ROUTES_EXEMPT],
    },
    {
      code: "import { value } from '@app';",
      filename: at('config/env.ts'),
    },
    {
      code: 'export const other = 1;\nconst load = (path: string) => import(path);\nexport { load };',
      filename: at('app/page.ts'),
    },
  ],
  invalid: [
    {
      code: "import { value } from '../config/env';",
      filename: at('app/page.ts'),
      output: "import { value } from '@config/env';",
      errors: [{
        messageId: 'preferAlias',
        data: {
          specifier: '../config/env',
          replacement: '@config/env',
        },
      }],
    },
    {
      code: "import { value } from '../card';",
      filename: at('components/ui/button.ts'),
      output: "import { value } from '@components/card';",
      errors: [{ messageId: 'preferAlias' }],
    },
    {
      code: "import { value } from '../components/ui';",
      filename: at('app/page.ts'),
      output: "import { value } from '@ui';",
      errors: [{ messageId: 'preferAlias' }],
    },
    {
      code: "import { value } from '@ui';",
      filename: at('components/ui/button.ts'),
      output: "import { value } from '.';",
      errors: [{ messageId: 'preferRelative' }],
    },
    {
      code: "import { value } from '../lib/utils/format';",
      filename: at('components/card.ts'),
      output: "import { value } from '@utils/format';",
      errors: [{ messageId: 'preferAlias' }],
    },
    {
      code: 'export { value } from "../lib/client";',
      filename: at('app/page.ts'),
      output: 'export { value } from "@lib/client";',
      errors: [{ messageId: 'preferAlias' }],
    },
    {
      code: "export * from '../config/theme';\nexport const load = () => import('../config/env');",
      filename: at('app/page.ts'),
      output: "export * from '@config/theme';\nexport const load = () => import('@config/env');",
      errors: [{ messageId: 'preferAlias' }, { messageId: 'preferAlias' }],
    },
    {
      code: "import { value } from '@config/env';",
      filename: at('config/theme.ts'),
      output: "import { value } from './env';",
      errors: [{
        messageId: 'preferRelative',
        data: {
          specifier: '@config/env',
          replacement: './env',
        },
      }],
    },
    {
      code: "import { value } from '@config/env';",
      filename: at('config/flags/on.ts'),
      output: "import { value } from '../env';",
      errors: [{ messageId: 'preferRelative' }],
    },
    {
      code: "import { value } from '@config/flags';",
      filename: at('config/flags/deep/leaf.ts'),
      output: "import { value } from '..';",
      errors: [{ messageId: 'preferRelative' }],
    },
    {
      code: "import { value } from '@config/env';",
      filename: at('routes.ts'),
      options: [ROUTES_EXEMPT],
      output: "import { value } from './config/env';",
      errors: [{
        messageId: 'exemptRelative',
        data: {
          specifier: '@config/env',
          replacement: './config/env',
        },
      }],
    },
  ],
});
