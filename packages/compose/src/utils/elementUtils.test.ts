import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Sources,
  sourcesOf,
  type Trust,
} from './bindingUtils';
import { applied, type Edit } from './editUtils';
import { inlineElement } from './elementUtils';
import { scopeOf } from './scopeUtils';
import { parse, referencesIn } from './sourceUtils';
import { settled } from './stepUtils';

interface Filled {
  written: string;
}

const NO_TRUST: Trust = {
  plainData: [],
  pureCalls: [],
};

// One `<X>` of a text replaced by what the option component returns; undefined once none is left.
const filledOnce = (text: string, file: ts.SourceFile, sources: Sources): readonly Edit[] | undefined => {
  const heads = referencesIn(file, 'X')
    .map((tag) => {
      return tag.parent;
    })
    .filter((parent) => {
      return ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent);
    });
  const [head] = heads;
  const checker = scopeOf(file, sources.modules, sources.held);

  if (head === undefined || !ts.isIdentifier(head.tagName)) {
    return undefined;
  }

  return inlineElement(text, sources, head.tagName, head, checker);
};

// Every `<X>` filled through `settled`, so a fill that never ends is refused, not looped on.
const filled = (body: string, option: string): Filled => {
  const sources = sourcesOf(`import { X } from './p';\n\n${body}`, { './p': option }, {}, NO_TRUST);
  const start = parse(sources.body);
  const { text } = settled(start, (current, file) => {
    return filledOnce(current, file, sources);
  });
  const result: Filled = {
    written: text,
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
      'a key whose value has an effect, which the root still takes',
      'y = <X key={next()} />;\n',
      'export const X = () => <hr />;\n',
      'y = <hr key={next()} />;\n',
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
    const { written } = filled(body, option);

    expect(written).toBe(expected);
  });

  it('binds what each component reads from its own rest binding, two of one name (F8)', () => {
    const body = lines(
      'A = ({ id, ...rest }: Props) => <X {...rest}>{id}</X>;',
      'B = ({ name, ...rest }: Props) => <X {...rest}>{name}</X>;',
    );
    const option = 'export const X = ({ title, children }: P) => <section><h1>{title}</h1>{children}</section>;\n';
    const { written } = filled(body, option);
    const expected = lines(
      'A = ({ id, title }: Props) => <section><h1>{title}</h1>{id}</section>;',
      'B = ({ name, title }: Props) => <section><h1>{title}</h1>{name}</section>;',
    );

    expect(written).toBe(expected);
  });

  it('binds what a component reads from the rest it spreads when an outer rest has its name (F8)', () => {
    const body = 'y = ({ id, ...rest }) => <ul>{list.map(({ name, ...rest }) => <X {...rest}>{name}</X>)}</ul>;\n';
    const option = 'export const X = ({ title, children }: P) => <h1 title={title}>{children}</h1>;\n';
    const { written } = filled(body, option);
    const kept = 'y = ({ id, ...rest }) => <ul>';
    const expected = `${kept}{list.map(({ name, title }) => <h1 title={title}>{name}</h1>)}</ul>;\n`;

    expect(written).toBe(expected);
  });

  it('binds what a component reads from the rest past a nested binding of that name, which keeps its read', () => {
    const body = 'y = ({ ...rest }) => <ul><X {...rest} />{[1].map((current) => current)}</ul>;\n';
    const option = 'export const X = ({ current }: P) => <li hidden={current} />;\n';
    const { written } = filled(body, option);

    expect(written).toBe('y = ({ current }) => <ul><li hidden={current} />{[1].map((current) => current)}</ul>;\n');
  });

  it('binds what a component reads from a rest still spread, in the layout of a pattern written over lines', () => {
    const body = lines('y = ({', '  id,', '  ...rest', '}) => <ul><X {...rest} />{id}<X {...rest} /></ul>;');
    const option = 'export const X = ({ current, on }: P) => <li hidden={current} onClick={on} />;\n';
    const sources = sourcesOf(`import { X } from './p';\n\n${body}`, { './p': option }, {}, NO_TRUST);
    const file = parse(sources.body);
    const edits = filledOnce(sources.body, file, sources);
    const once = edits === undefined ? undefined : applied(sources.body, edits);
    const expected = lines(
      'y = ({',
      '  id,',
      '  current,',
      '  on,',
      '  ...rest',
      '}) => <ul><li hidden={current} onClick={on} />{id}<X {...rest} /></ul>;',
    );

    expect(once).toBe(expected);
  });

  it('binds what a component reads from the rest binding the base spreads, once per name', () => {
    const body = 'y = ({ ...rest }) => <ul><X {...rest} id="a" /><X {...rest} id="b" /></ul>;\n';
    const option = 'export const X = ({ id, current, on }: P) => <li id={id} hidden={current} onClick={on} />;\n';
    const { written } = filled(body, option);

    const item = (id: string): string => {
      return `<li id={'${id}'} hidden={current} onClick={on} />`;
    };

    expect(written).toBe(`y = ({ current, on }) => <ul>${item('a')}${item('b')}</ul>;\n`);
  });

  it.each([
    ['y = ({ ...rest }) => <X id="a" {...rest} />;'],
    ['y = ({ ...rest }) => <ul><X id="a" title="t" {...rest} /></ul>;'],
  ])('refuses a prop the component reads, written before the rest spread, in %j (F15)', (body) => {
    const run = (): Filled => {
      return filled(`${body}\n`, 'export const X = ({ id }: P) => <li id={id} />;\n');
    };

    expect(run).toThrow('"id" is written before the rest spread, which may give the component its own');
  });

  it('takes a key written before the rest spread', () => {
    const body = 'y = ({ ...rest }) => [1].map((id) => <X key={id} {...rest} id={id} />);\n';
    const { written } = filled(body, 'export const X = ({ id, on }: P) => <li id={id} onClick={on} />;\n');

    expect(written).toBe('y = ({ on }) => [1].map((id) => <li key={id} id={id} onClick={on} />);\n');
  });

  it('refuses children that read a name the option binds around {children}', () => {
    const body = 'y = (item) => <X>{item}</X>;';
    const option = 'export const X = ({ children }: P) => <ul>{[1].map((item) => <li>{children}</li>)}</ul>;\n';

    const fill = (): Filled => {
      return filled(body, option);
    };

    expect(fill).toThrow('"item" is also bound around {children} in the option\'s code, which would capture it: item');
  });

  it('places children that read a name the option binds only outside its root', () => {
    const body = 'y = (title) => <X title="a">{title}</X>;';
    const option = 'export const X = ({ title, children }: P) => <h1 title={title}>{children}</h1>;\n';
    const { written } = filled(body, option);

    expect(written).toBe('y = (title) => <h1 title={\'a\'}>{title}</h1>;');
  });

  it.each([
    ['y = <X title="a&amp;b &lt; c">x</X>;'],
    ['y = <X title="a & b" />;'],
    ['y = <X title="one\ntwo" />;'],
    ['y = <X title="one\rtwo" />;'],
    ['y = <X title="one\u2028two" />;'],
  ])('refuses an attribute string JSX reads otherwise than a JS string, in %j (F14)', (body) => {
    const run = (): Filled => {
      return filled(`${body}\n`, 'export const X = ({ title }: P) => <h1>{title}</h1>;\n');
    };

    expect(run).toThrow('An attribute string holding "&" or a line break means another text as a JS string');
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
      'y = <X>hello</X>;',
      'export const X = ({ children }: P) => <p title={children} />;\n',
      /can only render its children in place: children/u,
    ],
    [
      'y = xs.map((x) => <X key={x} />);',
      'export const X = () => <li key="fixed" />;\n',
      /The option component's root has a key of its own, so the base's key has no place: <X key=\{x\} \/>/u,
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
      'y = <X b={g()} a={f()} />;',
      'export const X = ({ a, b }: P) => <i>{a}{b}</i>;\n',
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
    [
      'y = ({ ...rest }) => <ul><X {...rest} />{rest}</ul>;',
      'export const X = ({ id }: P) => <li id={id} />;\n',
      /"rest" is still read after composing/u,
    ],
    [
      'y = ({ ...rest }) => <ul><X {...rest} /><div {...rest} /></ul>;',
      'export const X = ({ id }: P) => <li id={id} />;\n',
      /"rest" is still read after composing/u,
    ],
    [
      'y = ({ ...rest }) => <ul><X {...rest} /><a.b {...rest} /></ul>;',
      'export const X = ({ id }: P) => <li id={id} />;\n',
      /"rest" is still read after composing/u,
    ],
    [
      'y = ({ ...rest }) => <ul><X {...rest} />{[1].map((X) => <X {...rest} />)}</ul>;',
      'export const X = ({ id }: P) => <li id={id} />;\n',
      /"rest" is still read after composing/u,
    ],
    [
      'y = ({ ...rest }) => [1].map((current) => <X key={current} {...rest} />);',
      'export const X = ({ current }: P) => <li hidden={current} />;\n',
      /reads "current" from "rest", and the base binds that name too/u,
    ],
    [
      'y = ({ ...rest }) => <ul><X {...rest} />{current}</ul>;',
      'export const X = ({ current }: P) => <li hidden={current} />;\n',
      /reads "current" from "rest", which would capture this read: current/u,
    ],
    [
      'const current = 1;\ny = ({ ...rest }) => <ul><X {...rest} />{current}</ul>;',
      'export const X = ({ current }: P) => <li hidden={current} />;\n',
      /which would capture this read: current/u,
    ],
    [
      'y = ({ ...rest }) => <X {...{ a: 1 }} />;',
      'export const X = ({ id }: P) => <li id={id} />;\n',
      /Only a rest binding can be spread/u,
    ],
    [
      'y = () => <X {...props} />;',
      'export const X = ({ id }: P) => <li id={id} />;\n',
      /Only a rest binding can be spread/u,
    ],
    [
      'y = (rest) => <X {...rest} />;',
      'export const X = ({ id }: P) => <li id={id} />;\n',
      /Only a rest binding can be spread/u,
    ],
    [
      'y = ({ rest }) => <X {...rest} />;',
      'export const X = ({ id }: P) => <li id={id} />;\n',
      /Only a rest binding can be spread/u,
    ],
    [
      'y = ([...rest]) => <X {...rest} />;',
      'export const X = ({ id }: P) => <li id={id} />;\n',
      /Only a rest binding can be spread/u,
    ],
    [
      'y = () => {\n  const { ...rest } = props;\n\n  return <X {...rest} />;\n};',
      'export const X = ({ id }: P) => <li id={id} />;\n',
      /Only a rest binding can be spread/u,
    ],
  ])('refuses %s from %j', (body, option, message) => {
    const run = (): Filled => {
      return filled(`${body}\n`, option);
    };

    expect(run).toThrow(message);
  });
});
