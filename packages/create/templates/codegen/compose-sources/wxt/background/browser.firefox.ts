import { onInstalled } from './onInstalled';

export const installed = {
  first: {
    reason: 'install',
    temporary: false,
  },
  update: {
    reason: 'update',
    previousVersion: '0.1.0',
    temporary: false,
  },
};

export const browserCases = (): void => {
  it('announces a temporary install, which is how web-ext loads the extension', () => {
    const warn = vi.spyOn(console, 'warn')
      .mockImplementation(() => {
        return undefined;
      });

    onInstalled({
      reason: 'install',
      temporary: true,
    });

    expect(warn).toHaveBeenCalledWith('Extension installed.');

    warn.mockRestore();
  });
};
