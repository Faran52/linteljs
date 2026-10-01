import { mount } from '@vue/test-utils';

import CodeText from './CodeText.vue';

describe('CodeText', () => {
  it('sets each marked command in code, and the rest as text', () => {
    const line = 'Recorded in <code>a.json</code>, which <code>sync</code> reads.';
    const text = mount(CodeText, { props: { text: line } });

    const codes = text
      .findAll('code')
      .map((code) => {
        return code.text();
      });

    expect(codes).toEqual(['a.json', 'sync']);
    expect(text.text()).toBe('Recorded in a.json, which sync reads.');
  });

  it('leaves a line with nothing marked as text alone', () => {
    const text = mount(CodeText, { props: { text: '<b>plain</b>' } });

    expect(text
      .find('code')
      .exists()).toBe(false);
    expect(text.text()).toBe('<b>plain</b>');
  });
});
