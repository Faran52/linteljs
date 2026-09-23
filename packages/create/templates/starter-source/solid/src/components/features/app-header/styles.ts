/*
 * The header's styles as props, so the component spreads them and never spells a class or a style call.
 *
 * That indirection is the whole point of this file. `AppHeader.tsx` already varies by router, and without this it
 * would vary by the styling answer as well, which is a copy per combination rather than per answer. Here the
 * markup is one file and only this one changes: under StyleX the same three names come back as compiled atomic
 * classes instead.
 */
interface ElementProps {
  readonly class: string;
}

export const styles = {
  header: { class: 'header' },
  brand: { class: 'brand' },
  tabs: { class: 'tabs' },

  // A function, because the current tab is a conditional style, threaded the same way under either answer.
  tab: (current: boolean): ElementProps => {
    return { class: current ? 'tab tab-button tab-current' : 'tab tab-button' };
  },
};
