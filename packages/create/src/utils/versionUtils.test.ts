import { majorOf, rankOf } from './versionUtils';

describe('rankOf', () => {
  it('orders two versions by major, then minor, then patch', () => {
    const rank = rankOf('22.6.0');
    expect(rank).toBeLessThan(rankOf('22.18.0'));
    const rank2 = rankOf('22.18.0');
    expect(rank2).toBeLessThan(rankOf('26.9.0'));
    const rank3 = rankOf('10.25.0');
    expect(rank3).toBeLessThan(rankOf('10.26.0'));
    const rank4 = rankOf('1.2.0');
    expect(rank4).toBe(rankOf('1.2.0'));
  });

  it('reads a missing field as zero', () => {
    const rank = rankOf('22');
    expect(rank).toBe(rankOf('22.0.0'));
    const rank2 = rankOf('22.6');
    expect(rank2).toBe(rankOf('22.6.0'));
  });
});

describe('majorOf', () => {
  it('reads the first field, whatever follows it', () => {
    const major = majorOf('1.22.22');
    expect(major).toBe(1);
    const major2 = majorOf('12.5.1');
    expect(major2).toBe(12);
    const major3 = majorOf('26');
    expect(major3).toBe(26);
  });
});
