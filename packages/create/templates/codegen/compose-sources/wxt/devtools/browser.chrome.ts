export const createPanel = (title: string): ReturnType<typeof chrome.devtools.panels.create> => {
  return chrome.devtools.panels.create(title, '', 'panel.html');
};
