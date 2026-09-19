import { Platform } from 'react-native';

import {
  BottomTabInset,
  Colors,
  Fonts,
  MaxContentWidth,
  Spacing,
} from './theme';

const themeOn = async (os: string): Promise<typeof import('./theme')> => {
  vi.resetModules();
  vi.doMock('react-native', async () => {
    const actual = await vi.importActual<typeof import('react-native')>('react-native');
    const platform = {
      OS: os,
      select: (options: Record<string, unknown>) => {
        return options[os] ?? options['default'];
      },
    };

    return new Proxy(actual, {
      get: (target, key): unknown => {
        return key === 'Platform' ? platform : Reflect.get(target, key);
      },
    });
  });

  return import('./theme');
};

afterEach(() => {
  vi.doUnmock('react-native');
  vi.resetModules();
});

describe('Colors', () => {
  it('carries the same keys in both palettes, so a theme lookup cannot miss', () => {
    expect(Object.keys(Colors.dark)).toEqual(Object.keys(Colors.light));
  });
});

describe('Spacing', () => {
  it('is an ascending scale', () => {
    const steps = Object.values(Spacing);

    expect([...steps].sort((left, right) => {
      return left - right;
    })).toEqual(steps);
  });

  it('names a maximum content width', () => {
    expect(MaxContentWidth).toBeGreaterThan(0);
  });
});

describe('Fonts', () => {
  it('names a font for every role on this platform', () => {
    expect(Object.keys(Fonts).sort((left, right) => {
      return left.localeCompare(right, 'en');
    })).toEqual(['mono', 'rounded', 'sans', 'serif']);
  });

  it('takes the web custom properties on web and the system faces on ios', async () => {
    expect((await themeOn('web')).Fonts.sans).toBe('var(--font-display)');
    expect((await themeOn('ios')).Fonts.sans).toBe('system-ui');
  });

  it('falls back to the generic families on a platform it does not name', async () => {
    expect((await themeOn('android')).Fonts.sans).toBe('normal');
  });
});

describe('BottomTabInset', () => {
  it('reserves the tab bar height each platform actually uses', async () => {
    expect((await themeOn('ios')).BottomTabInset).toBe(50);
    expect((await themeOn('android')).BottomTabInset).toBe(80);
  });

  it('reserves nothing where there is no native tab bar', async () => {
    expect((await themeOn('web')).BottomTabInset).toBe(0);
  });

  it('is a number on the platform this suite runs as', () => {
    expect(typeof BottomTabInset).toBe('number');
    expect(Platform.OS).toBeTruthy();
  });
});
