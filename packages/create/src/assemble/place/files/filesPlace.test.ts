import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Share } from '../../utils/shareUtils';

import { filesPlace, type TextFile } from './filesPlace';

const fileOf = (path: string, text = ''): TextFile => {
  const file: TextFile = {
    path,
    source: `/templates/${path}`,
    text,
  };

  return file;
};

const NEXT: Share = {
  place: {
    ui: 'src/components/ui',
    apis: 'src/lib/apis',
    pages: '{dir}/page',
    naming: 'camel',
    tests: '.test',
  },
  pages: {
    home: 'src/app',
    contact: 'src/app/contact',
  },
};

const ANGULAR: Share = {
  place: {
    ui: 'src/app/ui',
    apis: 'src/lib/apis',
    utils: 'src/lib/utils',
    i18n: 'src/i18n',
    pages: 'src/views/{page}/{Page}View',
    naming: 'kebab',
    tests: '.spec',
  },
};

const pathsOf = (files: readonly TextFile[], share: Share): string[] => {
  return filesPlace(files, share)
    .map(({ path }) => {
      return path;
    });
};

describe('filesPlace', () => {
  it('lands each root in its directory, names kept under camel', () => {
    const files = [
      fileOf('ui/button/Button.styles.ts'),
      fileOf('apis/contact/contactEndpoints.test.ts'),
      fileOf('pages/contact/contact.css'),
      fileOf('pages/home/home.css'),
    ];
    const paths = pathsOf(files, NEXT);

    expect(paths).toEqual([
      'src/components/ui/button/Button.styles.ts',
      'src/lib/apis/contact/contactEndpoints.test.ts',
      'src/app/contact/page.css',
      'src/app/page.css',
    ]);
  });

  it('kebabs each file name, not its directories, and swaps the test suffix', () => {
    const files = [
      fileOf('ui/text-input/TextInput.styles.ts'),
      fileOf('apis/contact/contactEndpoints.spec-helper.ts'),
      fileOf('apis/contact/contactEndpoints.test.ts'),
      fileOf('i18n/i18n.ts'),
      fileOf('i18n/LICENSE'),
      fileOf('pages/about/about.test.css'),
    ];
    const paths = pathsOf(files, ANGULAR);

    expect(paths).toEqual([
      'src/app/ui/text-input/text-input.styles.ts',
      'src/lib/apis/contact/contact-endpoints.spec-helper.ts',
      'src/lib/apis/contact/contact-endpoints.spec.ts',
      'src/i18n/i18n.ts',
      'src/i18n/license',
      'src/views/about/AboutView.spec.css',
    ]);
  });

  it('points relative specifiers at the placed files, other files copied untouched', () => {
    const importer = [
      'import { contactEndpoints } from "./contactEndpoints";',
      "import { styles } from '../../ui/button/Button.styles';",
      "import { Button } from '../../ui/button';",
      "import data from './data.json';",
      "vi.mock('./contactEndpoints');",
      "import { missing } from './missing';",
      "import { zod } from 'zod';",
    ].join('\n');
    const files = [
      fileOf('apis/contact/contactApi.ts', importer),
      fileOf('apis/contact/contactEndpoints.ts'),
      fileOf('apis/contact/data.json'),
      fileOf('ui/button/Button.styles.ts'),
      fileOf('ui/button/index.ts', "export { Button } from './Button.styles';"),
    ];
    const placed = filesPlace(files, ANGULAR);
    const api = placed.at(0);
    const endpoints = placed.at(1);
    const barrel = placed.at(4);
    const expected = [
      'import { contactEndpoints } from "./contact-endpoints";',
      "import { styles } from '../../../app/ui/button/button.styles';",
      "import { Button } from '../../../app/ui/button';",
      "import data from './data.json';",
      "vi.mock('./contact-endpoints');",
      "import { missing } from './missing';",
      "import { zod } from 'zod';",
    ].join('\n');

    expect(api?.text).toBe(expected);
    expect(api?.source).toBe('/templates/apis/contact/contactApi.ts');
    expect(endpoints?.text).toBeUndefined();
    expect(barrel?.text).toBe("export { Button } from './button.styles';");
  });

  it('points alias specifiers at the placed files through the unit\'s tsconfig paths', () => {
    const share: Share = {
      ...ANGULAR,
      tsconfig: {
        compilerOptions: {
          paths: {
            '@ui': ['./src/app/ui/index.ts'],
            '@ui/*': ['./src/old-ui/*', './src/app/ui/*'],
            '@lib/*': ['./src/lib/*'],
            '@lib/legacy/*': ['./src/lib/utils/*'],
            '@utils/*': ['./src/lib/utils/*'],
            '@utils/fetchExtendedUtils': ['./src/lib/utils/fetch-extended-utils.ts'],
          },
        },
      },
    };
    const importer = [
      "import { ForbiddenError } from '@utils/statusUtils';",
      'import { styles } from "@ui/text-input/TextInput.styles";',
      "import { TextInput } from '@ui/text-input';",
      "import { status } from '@lib/utils/statusUtils';",
      "import { legacy } from '@lib/legacy/statusUtils';",
      "import { request } from '@utils/fetchExtendedUtils';",
      "import { missing } from '@utils/missing';",
      "import { useQuery } from '@tanstack/angular-query';",
      "import { Ui5Button } from '@ui5/webcomponents';",
      "vi.mock('@utils/statusUtils');",
    ].join('\n');
    const files = [
      fileOf('apis/contact/contactApi.ts', importer),
      fileOf('ui/text-input/TextInput.styles.ts'),
      fileOf('ui/text-input/index.ts'),
      fileOf('utils/statusUtils.ts'),
      fileOf('utils/fetchExtendedUtils.ts'),
      fileOf('pages/about/about.css'),
    ];
    const api = filesPlace(files, share).at(0);
    const expected = [
      "import { ForbiddenError } from '@utils/status-utils';",
      'import { styles } from "@ui/text-input/text-input.styles";',
      "import { TextInput } from '@ui/text-input';",
      "import { status } from '@lib/utils/status-utils';",
      "import { legacy } from '@lib/legacy/status-utils';",
      "import { request } from '@utils/fetchExtendedUtils';",
      "import { missing } from '@utils/missing';",
      "import { useQuery } from '@tanstack/angular-query';",
      "import { Ui5Button } from '@ui5/webcomponents';",
      "vi.mock('@utils/status-utils');",
    ].join('\n');

    expect(api?.text).toBe(expected);
  });

  it('refuses a layer file importing through an alias outside the core names', () => {
    const share: Share = {
      ...NEXT,
      tsconfig: { compilerOptions: { paths: { '@store/*': ['./src/lib/store/*'] } } },
    };
    const files = [fileOf('apis/contact/contactApi.ts', "import { store } from '@store/counter';")];

    expect(() => {
      return filesPlace(files, share);
    }).toThrow('apis/contact/contactApi.ts imports @store/counter through @store, which is not a core alias');
  });

  it.each([
    ['features/header/Header.ts', 'features/header/Header.ts starts with no place root'],
    ['naming/x.ts', 'naming/x.ts starts with no place root'],
    ['tests/x.ts', 'tests/x.ts starts with no place root'],
    ['loose.ts', 'loose.ts is not under a place root'],
  ])('refuses %s, outside every place root', (path, message) => {
    const files = [fileOf(path)];

    expect(() => {
      return filesPlace(files, NEXT);
    }).toThrow(message);
  });

  it('lands a file below its page in the page\'s placed directory, its name kept', () => {
    const files = [
      fileOf('pages/home/use-counter/useCounter.ts'),
      fileOf('pages/contact/use-contact-form/useContactForm.test.ts'),
      fileOf('pages/contact/utils/deep/contactCopyUtils.ts'),
    ];
    const nextPaths = pathsOf(files, NEXT);
    const angularPaths = pathsOf(files, ANGULAR);

    expect(nextPaths).toEqual([
      'src/app/use-counter/useCounter.ts',
      'src/app/contact/use-contact-form/useContactForm.test.ts',
      'src/app/contact/utils/deep/contactCopyUtils.ts',
    ]);

    expect(angularPaths).toEqual([
      'src/views/home/use-counter/use-counter.ts',
      'src/views/contact/use-contact-form/use-contact-form.spec.ts',
      'src/views/contact/utils/deep/contact-copy-utils.ts',
    ]);
  });

  it('refuses a page the shell\'s pages map lacks', () => {
    const files = [fileOf('pages/about/about.css')];

    expect(() => {
      return filesPlace(files, NEXT);
    }).toThrow('pages/about/about.css is a page the shell\'s pages map lacks');
  });

  it('refuses a naming that is neither camel nor kebab', () => {
    const share: Share = {
      place: {
        ui: 'src/ui',
        naming: 'snake',
        tests: '.test',
      },
    };

    expect(() => {
      return filesPlace([fileOf('ui/x.ts')], share);
    }).toThrow('place naming snake is not camel or kebab');
  });
});
