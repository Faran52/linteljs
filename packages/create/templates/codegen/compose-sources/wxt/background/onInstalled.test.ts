import { browserCases, installed } from './browser';
import { onInstalled } from './onInstalled';

describe('onInstalled', () => {
  it('announces a first install', () => {
    const warn = vi.spyOn(console, 'warn')
      .mockImplementation(() => {
        return undefined;
      });

    onInstalled(installed.first);

    expect(warn).toHaveBeenCalledWith('Extension installed.');

    warn.mockRestore();
  });

  it('says nothing on an update, which is not a first install', () => {
    const warn = vi.spyOn(console, 'warn')
      .mockImplementation(() => {
        return undefined;
      });

    onInstalled(installed.update);

    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  browserCases();
});
