export const CODE_EXTENSION = /\.[cm]?[jt]sx?$/v;

export const RELATIVE_SPECIFIER = /(?<quote>['"])(?<specifier>\.\.?\/[^'"\n]+)\k<quote>/gv;

export const NOT_DOTTED = /^(?!\.)/v;

export const USE_CLIENT = "'use client';\n\n";

export const STYLEX_PROPS = 'stylex.props';

export const STYLEX_ATTRS = 'stylex.attrs';

// A suite several targets share is written for vitest; jest has the same globals, under `jest` and unimported.
export const VITEST_IMPORT = /^import \{[^\}]*\} from 'vitest';\n/mv;

export const VI_MEMBER = /\bvi\./gv;

// Jest has no `stubGlobal`; a spy on the global is restored with every other one.
export const STUB_GLOBAL = /\bvi\.stubGlobal\('(?<name>\w+)', (?<value>\w+)\)/gv;

// The contact copy of a project with no mock, then what it reads once msw answers the form, in every locale.
export const MSW_COPY: readonly (readonly [string, string])[] = [
  ['Nothing is sent anywhere.', 'It posts to /api/contact, mocked in dev.'],
  ['Thanks. Nothing was sent, this is a starter.', 'Thanks. Your message was sent.'],
  ['لا يُرسَل شيء إلى أي مكان.', 'يُرسَل إلى /api/contact، ويجيب عنه المحاكي أثناء التطوير.'],
  ['شكرًا. لم يُرسَل شيء، فهذا مشروع بداية.', 'شكرًا. أُرسلت رسالتك.'],
  ['どこにも送信されません。', '/api/contact に送信され、開発中はモックが応答します。'],
  ['ありがとうございます。これはスターターなので、何も送信されていません。', 'ありがとうございます。メッセージを送信しました。'],
  ['어디로도 전송되지 않습니다.', '/api/contact로 전송되며, 개발 중에는 모의 서버가 응답합니다.'],
  ['감사합니다. 스타터이므로 아무것도 전송되지 않았습니다.', '감사합니다. 메시지가 전송되었습니다.'],
  ['不会发送到任何地方。', '会发送到 /api/contact，开发时由模拟服务器响应。'],
  ['谢谢。这是一个起步项目，没有发送任何内容。', '谢谢。您的消息已发送。'],
  ['不會傳送到任何地方。', '會傳送到 /api/contact，開發時由模擬伺服器回應。'],
  ['謝謝。這是一個入門專案，沒有傳送任何內容。', '謝謝。您的訊息已傳送。'],
];
