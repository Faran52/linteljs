// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import TextInput from './TextInput.astro';

describe('TextInput', () => {
  it('labels a text input by its id', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TextInput, { props: { id: 'name', label: 'Name', value: 'Ada' } });

    expect(html).toMatch(/<label[^>]*for="name"[^>]*>Name<\/label>/u);
    expect(html).toMatch(/<input[^>]*type="text"[^>]*value="Ada"/u);
    expect(html).not.toMatch(/aria-describedby/u);
  });

  it('renders a textarea when multiline', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TextInput, { props: { id: 'message', label: 'Message', multiline: true } });

    expect(html).toMatch(/<textarea[^>]*name="message"/u);
    expect(html).not.toMatch(/<input/u);
  });

  it('ties an error to the control', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TextInput, { props: { id: 'email', label: 'Email', type: 'email', error: 'Required' } });

    expect(html).toMatch(/aria-invalid="true"[^>]*aria-describedby="email-error"/u);
    expect(html).toMatch(/<p[^>]*id="email-error"[^>]*>Required<\/p>/u);
  });
});
