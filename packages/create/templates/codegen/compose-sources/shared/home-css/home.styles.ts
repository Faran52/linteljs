import { counterClasses } from './store';

export const styles = {
  hero: { class: 'hero' },
  title: { class: 'title' },
  lede: { class: 'lede' },
  ...counterClasses,
  hint: { class: 'hint' },
};
