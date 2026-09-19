import { renderHook } from '@testing-library/react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

import { useTheme } from './useTheme';

vi.mock('@/hooks/useColorScheme', () => {
  return { useColorScheme: vi.fn() };
});

const mockedScheme = vi.mocked(useColorScheme);

const themeFrom = async (scheme: string) => {
  mockedScheme.mockReturnValue(scheme as ReturnType<typeof useColorScheme>);

  const { result } = await renderHook(() => {
    return useTheme();
  });

  return result.current;
};

describe('useTheme', () => {
  it('reads the dark palette when the system is dark', async () => {
    expect(await themeFrom('dark')).toBe(Colors.dark);
  });

  it('reads the light palette when the system is light', async () => {
    expect(await themeFrom('light')).toBe(Colors.light);
  });

  it('falls back to light when the system reports unspecified, as Android does', async () => {
    expect(await themeFrom('unspecified')).toBe(Colors.light);
  });
});
