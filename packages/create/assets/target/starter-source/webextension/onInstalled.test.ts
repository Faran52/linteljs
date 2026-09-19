import { onInstalled } from './onInstalled';

describe('onInstalled', () => {
  it('announces a first install', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
      return undefined;
    });

    onInstalled({ reason: 'install' });

    expect(warn).toHaveBeenCalledWith('Extension installed.');

    warn.mockRestore();
  });

  it('says nothing on an update, which is not a first install', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
      return undefined;
    });

    onInstalled({ reason: 'update', previousVersion: '0.1.0' });

    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});
