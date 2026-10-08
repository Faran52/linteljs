import { projectNameOf, unscopedName } from './nameUtils';

describe('unscopedName', () => {
  it('drops the scope of a scoped name', () => {
    const name = unscopedName('@acme/web-app');
    expect(name).toBe('web-app');
  });

  it('leaves an unscoped name as it is', () => {
    const name = unscopedName('web-app');
    expect(name).toBe('web-app');
  });

  it('drops only a leading scope', () => {
    const name = unscopedName('docs@2/guide');
    expect(name).toBe('docs@2/guide');
  });
});

describe('projectNameOf', () => {
  it('kebab-cases the unscoped name', () => {
    const name = projectNameOf('@acme/my_app.v2');
    expect(name).toBe('my-app-v-2');
  });
});
