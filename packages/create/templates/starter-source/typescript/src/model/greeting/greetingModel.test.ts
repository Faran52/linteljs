import { greeting } from './greetingModel';

describe('greeting', () => {
  it('greets a name', () => {
    const message = greeting('Ada');

    expect(message).toBe('Hello, Ada!');
  });
});
