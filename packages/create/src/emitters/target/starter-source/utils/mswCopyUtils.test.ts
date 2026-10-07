import { withMswCopy } from './mswCopyUtils';

describe('withMswCopy', () => {
  it('says where the form posts', () => {
    const actual = withMswCopy('<p>Nothing is sent anywhere.</p>');
    expect(actual).toBe('<p>It posts to /api/contact, mocked in dev.</p>');
  });

  it('confirms the message in a locale', () => {
    const actual = withMswCopy('"contactSent": "谢谢。这是一个起步项目，没有发送任何内容。"');
    expect(actual).toBe('"contactSent": "谢谢。您的消息已发送。"');
  });

  it('leaves other text alone', () => {
    const actual = withMswCopy('Send');
    expect(actual).toBe('Send');
  });
});
