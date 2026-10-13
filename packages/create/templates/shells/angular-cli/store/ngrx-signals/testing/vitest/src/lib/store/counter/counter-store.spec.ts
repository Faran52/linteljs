import { TestBed } from '@angular/core/testing';

import { CounterStore } from './counter-store';

describe('CounterStore', () => {
  it('counts up, and every reader sees the same count', () => {
    const one = TestBed.inject(CounterStore);
    const two = TestBed.inject(CounterStore);

    one.add();

    const actual = one.count();
    expect(actual).toBe(1);
    const actual2 = two.count();
    expect(actual2).toBe(1);
  });
});
