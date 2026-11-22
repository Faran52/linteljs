import { browser } from 'wxt/browser';

export const createPanel = (title: string): ReturnType<typeof browser.devtools.panels.create> => {
  return browser.devtools.panels.create(title, '', 'panel.html');
};
