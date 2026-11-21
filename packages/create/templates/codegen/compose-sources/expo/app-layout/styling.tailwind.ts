export const stylingCases = (): void => {
  // NativeWind's stylesheet means something to Metro only.
  jest.mock('./global.css', () => {
    return {};
  });
};
