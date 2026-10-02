import { majorOf, rankOf } from './versionUtils';

describe('rankOf', () => {
  it('orders two versions by major, then minor, then patch', () => {
    const lowerMinor = rankOf('22.6.0');
    expect(lowerMinor).toBeLessThan(rankOf('22.18.0'));
    const lowerMajor = rankOf('22.18.0');
    expect(lowerMajor).toBeLessThan(rankOf('26.9.0'));
    const lowerPatch = rankOf('10.25.0');
    expect(lowerPatch).toBeLessThan(rankOf('10.26.0'));
    const sameVersion = rankOf('1.2.0');
    expect(sameVersion).toBe(rankOf('1.2.0'));
  });

  it('reads a missing field as zero', () => {
    const majorOnly = rankOf('22');
    expect(majorOnly).toBe(rankOf('22.0.0'));
    const noPatch = rankOf('22.6');
    expect(noPatch).toBe(rankOf('22.6.0'));
  });
});

describe('majorOf', () => {
  it('reads the first field, whatever follows it', () => {
    const oneDigitMajor = majorOf('1.22.22');
    expect(oneDigitMajor).toBe(1);
    const twoDigitMajor = majorOf('12.5.1');
    expect(twoDigitMajor).toBe(12);
    const bareMajor = majorOf('26');
    expect(bareMajor).toBe(26);
  });
});
