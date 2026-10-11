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

  it('refuses a file nested below its page', () => {
    const files = [fileOf('pages/contact/parts/form.css')];

    expect(() => {
      return filesPlace(files, NEXT);
    }).toThrow('pages/contact/parts/form.css is nested below its page');
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
