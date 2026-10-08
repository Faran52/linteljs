import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { formAnswer } from './formAnswer';

describe('formAnswer', () => {
  it('takes a slot on an app and not on a library', () => {
    const app = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });
    const library = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'typescript',
    });

    const onApp = formAnswer.slot(app);
    expect(onApp).toBe(true);
    const onLibrary = formAnswer.slot(library);
    expect(onLibrary).toBe(false);
  });

  it('takes no slot on the web extension, which renders no contact page', () => {
    const extension = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
    });

    const onExtension = formAnswer.slot(extension);
    expect(onExtension).toBe(false);
  });

  it('is keyed form', () => {
    expect(formAnswer.key).toBe('form');
  });

  it('offers react-hook-form only where the target renders with React', () => {
    const react = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });
    const vue = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'vue',
    });

    const onReact = formAnswer.values['react-hook-form'].only(react);
    expect(onReact).toBe(true);
    const onVue = formAnswer.values['react-hook-form'].only(vue);
    expect(onVue).toBe(false);
  });
});
