import { majorOf, rankOf } from './versionUtils';

describe('rankOf', () => {
  it('orders two versions by major, then minor, then patch', () => {
    expect(rankOf('22.6.0')).toBeLessThan(rankOf('22.18.0'));
    expect(rankOf('22.18.0')).toBeLessThan(rankOf('26.9.0'));
    expect(rankOf('10.25.0')).toBeLessThan(rankOf('10.26.0'));
    expect(rankOf('1.2.0')).toBe(rankOf('1.2.0'));
  });

  it('reads a missing field as zero', () => {
    expect(rankOf('22')).toBe(rankOf('22.0.0'));
    expect(rankOf('22.6')).toBe(rankOf('22.6.0'));
  });
});

describe('majorOf', () => {
  it('reads the first field, whatever follows it', () => {
    expect(majorOf('1.22.22')).toBe(1);
    expect(majorOf('12.5.1')).toBe(12);
    expect(majorOf('26')).toBe(26);
  });
});
