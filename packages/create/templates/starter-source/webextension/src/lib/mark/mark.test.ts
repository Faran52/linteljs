import { markSvg } from './mark';

describe('markSvg', () => {
  it('is an image with a name, since it carries meaning rather than decoration', () => {
    expect(markSvg).toMatch(/^<svg[^>]*\srole="img"[^>]*\saria-label="linteljs"/v);
  });

  it('styles the lines and never the beam', () => {
    const paths = [...markSvg.matchAll(/<path [^>]*>/gv)];
    expect(paths).toHaveLength(4);

    const lines = paths
      .filter(([path]) => {
        return path.includes('class="mark-line');
      });
    expect(lines).toHaveLength(3);
  });
});
