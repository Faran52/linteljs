import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Sources, sourcesOf } from './bindingUtils';
import { inlineElement } from './elementUtils';
import { parse, referencesIn } from './sourceUtils';

interface Filled {
  written: string;
  rests: [string, string[]][];
}

// One `<X>` of a text replaced by what the option component returns; undefined once none is left.
const filledOnce = (text: string, sources: Sources): string | undefined => {
  const file = parse(text);
  const heads = referencesIn(file, 'X')
    .map((tag) => {
      return tag.parent;
    })
    .filter((parent) => {
      return ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent);
    });
  const [head] = heads;

  return head === undefined || !ts.isIdentifier(head.tagName)
    ? undefined
    : inlineElement(text, sources, head.tagName, head);
};

const filled = (body: string, option: string): Filled => {
  const sources = sourcesOf(`import { X } from './p';\n\n${body}`, { './p': option });
  let written = sources.body;

  for (let next = filledOnce(written, sources); next !== undefined; next = filledOnce(written, sources)) {
    written = next;
  }

  const result: Filled = {
    written,
    rests: [...sources.rests.entries()],
  };

  return result;
};

const lines = (...written: string[]): string => {
  return `${written.join('\n')}\n`;
};

const component = (signature: string, ...root: string[]): string => {
  return lines(`export const X = (${signature}) => {`, '  return (', ...root, '  );', '};');
};

describe('inlineElement', () => {
  it.each([
    [
      'a one-line component, its key and string attribute carried over',
      'y = <ul><X key="a" label="A" /></ul>;\n',
      'export const X = ({ label }: P) => <li title={label}>{label}</li>;\n',
      'y = <ul><li key="a" title={\'A\'}>{\'A\'}</li></ul>;\n',
    ],
    [
      'a component with no props, a bare attribute it ignores',
      'y = <X dense />;\n',
      'export const X = () => (<hr />);\n',
      'y = <hr />;\n',
    ],
    [
      'a bare attribute it reads, and a string that needs escaping',
      'y = <X dense label="it\'s \\ here" />;\n',
      'export const X = ({ dense, label }: P) => <hr hidden={dense} title={label} />;\n',
      'y = <hr hidden={true} title={\'it\\\'s \\\\ here\'} />;\n',
    ],
    [
      'a key onto a root that closes itself',
      'y = <X key="k" />;\n',
      'export const X = () => <hr />;\n',
      'y = <hr key="k" />;\n',
    ],
    [
      'a fragment',
      'y = <X />;\n',
      'export const X = () => <><a /><b /></>;\n',
      'y = <><a /><b /></>;\n',
    ],
    [
      'children in place, on one line',
      'y = <X>text</X>;\n',
      'export const X = ({ children }: P) => <li>{children}</li>;\n',
      'y = <li>text</li>;\n',
    ],
    [
      'no children, on one line and on a line of their own',
      'y = <X />;\nz = (\n  <X />\n);\n',
      component('{ children }: P', '    <div>', '      {children}', '    </div>'),
      'y = <div>\n</div>;\nz = (\n  <div>\n  </div>\n);\n',
    ],
    [
      'a root over several lines, with a key, children and a value moved to where it lands',
      lines(
        'y = (',
        '  <ul>',
        '    <X',
        '      key={id}',
        '      id={id}',
        '      on={() => {',
        '        go();',
        '      }}',
        '    >',
        '      {/* note */}',
        '      {t(id)}',
        '    </X>',
        '  </ul>',
        ');',
      ),
      component(
        '{ id, on, children }: P',
        '    <button',
        '      type="button"',
        '      aria-current={id === current}',
        '      onClick={on}',
        '    >',
        '      <b>',
        '        {children}',
        '      </b>',
        '    </button>',
      ),
      lines(
        'y = (',
        '  <ul>',
        '    <button',
        '      key={id}',
        '      type="button"',
        '      aria-current={id === current}',
        '      onClick={() => {',
        '        go();',
        '      }}',
        '    >',
        '      <b>',
        '        {/* note */}',
        '        {t(id)}',
        '      </b>',
        '    </button>',
        '  </ul>',
        ');',
      ),
    ],
  ])('fills %s', (_name, body, option, expected) => {
    const { written, rests } = filled(body, option);

    expect(written).toBe(expected);
    expect(rests).toStrictEqual([]);
  });

  it('notes what a component reads from the rest binding the base spreads, once per name', () => {
    const body = 'y = ({ ...rest }) => <ul><X id="a" {...rest} /><X id="b" {...rest} /></ul>;\n';
    const option = 'export const X = ({ id, current, on }: P) => <li id={id} hidden={current} onClick={on} />;\n';
    const { written, rests } = filled(body, option);

    const item = (id: string): string => {
      return `<li id={'${id}'} hidden={current} onClick={on} />`;
    };

    expect(written).toBe(`y = ({ ...rest }) => <ul>${item('a')}${item('b')}</ul>;\n`);
    expect(rests).toStrictEqual([['rest', ['current', 'on']]]);
  });

  it.each([
    [
      'y = <X />;',
      'export const X = 4;\n',
      /must be an arrow function/u,
    ],
    [
      'y = <X />;',
      'export const X = () => 4;\n',
      /must return one element/u,
    ],
    [
      'y = <X label="a" />;',
      'export const X = ({ label: text }: P) => <li>{text}</li>;\n',
      /must destructure plain props/u,
    ],
    [
      'y = <X label="a" />;',
      'export const X = ({ label = \'b\' }: P) => <li>{label}</li>;\n',
      /must destructure plain props/u,
    ],
    [
      'y = <X label="a" />;',
      'export const X = (props: P) => <li>{props.label}</li>;\n',
      /must destructure plain props/u,
    ],
    [
      'y = <X label="a" />;',
      'export const X = ({ label }: P, ref: R) => <li ref={ref}>{label}</li>;\n',
      /must destructure plain props/u,
    ],
    [
      'y = <X />;',
      'export const X = ({ label }: P) => <li>{label}</li>;\n',
      /needs "label", which the base does not pass/u,
    ],
    [
      'y = <X stamp={Date.now()} />;',
      'export const X = () => <li />;\n',
      /ignores "stamp", whose value has an effect/u,
    ],
    [
      'y = <X>text</X>;',
      'export const X = () => <li />;\n',
      /must render \{children\} once/u,
    ],
    [
      'y = <X>text</X>;',
      'export const X = ({ children }: P) => <li>{children}{children}</li>;\n',
      /must render \{children\} once/u,
    ],
    [
      'y = <X>text</X>;',
      'export const X = ({ children }: P) => <li title={String(children)}>{children}</li>;\n',
      /can only render its children in place/u,
    ],
    [
      'y = <X key="a" />;',
      'export const X = () => <></>;\n',
      /A key needs an element/u,
    ],
    [
      'y = <X {...props} />;',
      'export const X = () => <li />;\n',
      /Only a rest binding can be spread/u,
    ],
    [
      'y = <X {...a.b} />;',
      'export const X = () => <li />;\n',
      /Only a rest binding can be spread/u,
    ],
    [
      'y = ({ ...a }) => <X {...a} {...a} />;',
      'export const X = () => <li />;\n',
      /One rest spread at most/u,
    ],
    [
      'y = <X icon=<b /> />;',
      'export const X = () => <li />;\n',
      /must be a string or an expression/u,
    ],
    [
      'y = <X a="1" a="2" />;',
      'export const X = () => <li />;\n',
      /takes each attribute once/u,
    ],
    [
      'y = <X children="a" />;',
      'export const X = ({ children }: P) => <li>{children}</li>;\n',
      /its children between its tags/u,
    ],
    [
      'y = <X a={f()} b={g()} />;',
      'export const X = ({ a, b }: P) => <i>{b}{a}</i>;\n',
      /read in another order/u,
    ],
    [
      'y = <X a={f()} />;',
      'export const X = ({ a }: P) => <i>{a}{a}</i>;\n',
      /must be read once, and "a" is read 2 times/u,
    ],
    [
      'y = <X label={inner} />;',
      'export const X = ({ label }: P) => <ul>{[1].map((inner) => <li>{label}{inner}</li>)}</ul>;\n',
      /would capture it/u,
    ],
  ])('refuses %s from %j', (body, option, message) => {
    const run = (): Filled => {
      return filled(`${body}\n`, option);
    };

    expect(run).toThrow(message);
  });
});
