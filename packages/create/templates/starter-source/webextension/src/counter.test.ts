import { createCounter } from './counter';

describe('createCounter', () => {
  it('starts at zero and says so before anything happens', () => {
    const seen: number[] = [];

    createCounter((count) => {
      seen.push(count);
    });

    expect(seen).toEqual([0]);
  });

  it('counts up, and tells its reader each time', () => {
    const seen: number[] = [];
    const counter = createCounter((count) => {
      seen.push(count);
    });

    counter.add();
    counter.add();

    expect(counter.count).toBe(2);
    expect(seen).toEqual([0, 1, 2]);
  });
});
